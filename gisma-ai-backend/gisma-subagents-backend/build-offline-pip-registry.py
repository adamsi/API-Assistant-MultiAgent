#!/usr/bin/env python3
import argparse
import hashlib
import html
import json
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote

from packaging.utils import canonicalize_name, parse_sdist_filename, parse_wheel_filename


ROOT = Path(__file__).resolve().parent
DEFAULT_REQUIREMENTS = ROOT / "requirements.txt"
DEFAULT_OUTPUT = ROOT / "upload_python_folder"
ARTIFACTORY_INDEX = ".pypi"
SIMPLE_INDEX = "simple"
REPORT_NAME = "build-summary.json"
VALIDATION_NAME = "validation-current.json"

TARGET_PRESETS = {
    "win-amd64-py311": {
        "platform": "win_amd64",
        "python_version": "3.11",
        "implementation": "cp",
        "abi": "cp311",
    },
    "win-amd64-py312": {
        "platform": "win_amd64",
        "python_version": "3.12",
        "implementation": "cp",
        "abi": "cp312",
    },
    "win-amd64-py313": {
        "platform": "win_amd64",
        "python_version": "3.13",
        "implementation": "cp",
        "abi": "cp313",
    },
    "linux-x86_64-py311": {
        "platform": "manylinux_2_17_x86_64",
        "python_version": "3.11",
        "implementation": "cp",
        "abi": "cp311",
    },
    "linux-x86_64-py312": {
        "platform": "manylinux_2_17_x86_64",
        "python_version": "3.12",
        "implementation": "cp",
        "abi": "cp312",
    },
    "linux-x86_64-py313": {
        "platform": "manylinux_2_17_x86_64",
        "python_version": "3.13",
        "implementation": "cp",
        "abi": "cp313",
    },
    "macos-x86_64-py311": {
        "platform": "macosx_10_9_x86_64",
        "python_version": "3.11",
        "implementation": "cp",
        "abi": "cp311",
    },
    "macos-x86_64-py312": {
        "platform": "macosx_10_9_x86_64",
        "python_version": "3.12",
        "implementation": "cp",
        "abi": "cp312",
    },
    "macos-x86_64-py313": {
        "platform": "macosx_10_9_x86_64",
        "python_version": "3.13",
        "implementation": "cp",
        "abi": "cp313",
    },
    "macos-arm64-py311": {
        "platform": "macosx_11_0_arm64",
        "python_version": "3.11",
        "implementation": "cp",
        "abi": "cp311",
    },
    "macos-arm64-py312": {
        "platform": "macosx_11_0_arm64",
        "python_version": "3.12",
        "implementation": "cp",
        "abi": "cp312",
    },
    "macos-arm64-py313": {
        "platform": "macosx_11_0_arm64",
        "python_version": "3.13",
        "implementation": "cp",
        "abi": "cp313",
    },
}

DEFAULT_TARGETS = tuple(sorted(TARGET_PRESETS))

SUGGESTED_REPLACEMENTS = {
    "psycopg2-binary": "Prefer a pure-Python driver such as pg8000 if your stack allows it.",
    "psycopg-binary": "Prefer a pure-Python driver such as pg8000 if your stack allows it.",
    "psycopg": "Prefer pg8000 for maximum cross-platform portability if PostgreSQL performance is acceptable.",
    "asyncpg": "Prefer pg8000 if you need a pure-Python PostgreSQL client.",
    "langchain-postgres": "This pulls in PostgreSQL drivers and native wheels. Isolate it behind an optional extra if you need a universal offline bundle.",
    "tiktoken": "This uses native wheels. If exact token counting is optional, move it behind an optional extra or switch to a pure-Python tokenizer with lower fidelity.",
    "orjson": "Use the standard library json module if the performance tradeoff is acceptable.",
    "numpy": "Avoid the dependency if possible, or isolate it behind an optional extra because wheels are platform-specific.",
    "aiohttp": "Prefer httpx when you control the dependency directly; aiohttp stacks often pull compiled wheels.",
    "sqlalchemy": "SQLAlchemy can publish platform-specific wheels. Pin and test every target if you keep it.",
}


@dataclass(frozen=True)
class Artifact:
    filename: str
    project: str
    relative_path: str
    sha256: str
    kind: str
    universal: bool


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def run_capture(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, check=True, text=True, capture_output=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build an offline PyPI-style repository for Artifactory from requirements.txt.",
    )
    parser.add_argument(
        "--requirements",
        default=str(DEFAULT_REQUIREMENTS),
        help="Path to the requirements file to mirror.",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Directory where the offline repository tree will be created.",
    )
    parser.add_argument(
        "--target",
        action="append",
        choices=sorted(TARGET_PRESETS),
        help=(
            "Download wheels for a specific runtime target. Repeat for more than one target. "
            f"If omitted, the script downloads for all common targets: {', '.join(DEFAULT_TARGETS)}."
        ),
    )
    parser.add_argument(
        "--include-sdists",
        action="store_true",
        help="Also download source distributions when a wheel is not enough or you want fuller mirror coverage.",
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip the local pip dry-run validation for the current interpreter.",
    )
    return parser.parse_args()


def bucket_name(project: str) -> str:
    first = project[0] if project else "0"
    if first.isalpha():
        return f"packages-{first}"
    return "packages-0"


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def direct_requirements(requirements_path: Path) -> list[str]:
    names: list[str] = []
    for line in requirements_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        name = stripped.split(";", 1)[0].strip()
        for sep in ("==", ">=", "<=", "~=", "!=", ">", "<"):
            if sep in name:
                name = name.split(sep, 1)[0].strip()
                break
        if "[" in name:
            name = name.split("[", 1)[0].strip()
        names.append(canonicalize_name(name))
    return sorted(set(names))


def detect_project(filename: str) -> tuple[str, str, bool]:
    if filename.endswith(".whl"):
        name, _, _, tags = parse_wheel_filename(filename)
        universal = any(tag.platform == "any" for tag in tags)
        return canonicalize_name(str(name)), "wheel", universal

    name, _ = parse_sdist_filename(filename)
    return canonicalize_name(str(name)), "sdist", False


def download_for_target(requirements_path: Path, stage_dir: Path, target_name: str, include_sdists: bool) -> None:
    target = TARGET_PRESETS[target_name]
    args = [
        sys.executable,
        "-m",
        "pip",
        "download",
        "-r",
        str(requirements_path),
        "--dest",
        str(stage_dir),
        "--platform",
        target["platform"],
        "--python-version",
        target["python_version"],
        "--implementation",
        target["implementation"],
        "--abi",
        target["abi"],
    ]
    if include_sdists:
        args.extend(["--prefer-binary"])
    else:
        args.extend(["--only-binary", ":all:"])
    run(*args)


def download_sdists(requirements_path: Path, stage_dir: Path) -> None:
    run(
        sys.executable,
        "-m",
        "pip",
        "download",
        "-r",
        str(requirements_path),
        "--dest",
        str(stage_dir),
        "--no-binary",
        ":all:",
    )


def organize_artifacts(stage_dir: Path, output_dir: Path) -> list[Artifact]:
    artifacts: list[Artifact] = []
    for path in sorted(stage_dir.iterdir(), key=lambda item: item.name.lower()):
        if not path.is_file():
            continue

        project, kind, universal = detect_project(path.name)
        package_dir = output_dir / bucket_name(project) / "-"
        package_dir.mkdir(parents=True, exist_ok=True)
        destination = package_dir / path.name

        if not destination.exists():
            shutil.copy2(path, destination)

        relative_path = destination.relative_to(output_dir).as_posix()
        artifacts.append(
            Artifact(
                filename=path.name,
                project=project,
                relative_path=relative_path,
                sha256=hash_file(destination),
                kind=kind,
                universal=universal,
            )
        )

    deduped: dict[str, Artifact] = {}
    for artifact in artifacts:
        deduped[artifact.relative_path] = artifact
    return sorted(deduped.values(), key=lambda item: (item.project, item.filename.lower()))


def write_html_page(path: Path, title: str, links: list[str]) -> None:
    body = "\n".join(links)
    path.write_text(
        (
            "<!DOCTYPE html>\n"
            "<html>\n"
            "<head>\n"
            '  <meta charset="utf-8"/>\n'
            f"  <title>{html.escape(title)}</title>\n"
            "</head>\n"
            "<body>\n"
            f"{body}\n"
            "</body>\n"
            "</html>\n"
        ),
        encoding="utf-8",
    )


def build_artifactory_index(output_dir: Path, artifacts: list[Artifact]) -> None:
    pypi_dir = output_dir / ARTIFACTORY_INDEX
    pypi_dir.mkdir(parents=True, exist_ok=True)

    by_project: dict[str, list[Artifact]] = {}
    for artifact in artifacts:
        by_project.setdefault(artifact.project, []).append(artifact)

    project_links = []
    for project in sorted(by_project):
        project_file = pypi_dir / f"{project}.html"
        links = []
        for artifact in sorted(by_project[project], key=lambda item: item.filename.lower()):
            href = f"../{quote(artifact.relative_path)}#sha256={artifact.sha256}"
            links.append(f'<a href="{href}">{html.escape(artifact.filename)}</a><br/>')
        write_html_page(project_file, project, links)
        project_links.append(f'<a href="{quote(project)}.html">{html.escape(project)}</a><br/>')

    write_html_page(pypi_dir / "index.html", "Offline PyPI", project_links)


def build_simple_index(output_dir: Path, artifacts: list[Artifact]) -> None:
    simple_dir = output_dir / SIMPLE_INDEX
    simple_dir.mkdir(parents=True, exist_ok=True)

    by_project: dict[str, list[Artifact]] = {}
    for artifact in artifacts:
        by_project.setdefault(artifact.project, []).append(artifact)

    root_links = []
    for project in sorted(by_project):
        project_dir = simple_dir / project
        project_dir.mkdir(parents=True, exist_ok=True)
        links = []
        for artifact in sorted(by_project[project], key=lambda item: item.filename.lower()):
            href = f"../../{quote(artifact.relative_path)}#sha256={artifact.sha256}"
            links.append(f'<a href="{href}">{html.escape(artifact.filename)}</a><br/>')
        write_html_page(project_dir / "index.html", project, links)
        root_links.append(f'<a href="{quote(project)}/">{html.escape(project)}</a><br/>')

    write_html_page(simple_dir / "index.html", "Offline Simple Index", root_links)


def summarize_artifacts(artifacts: list[Artifact], requested: list[str], targets: list[str]) -> dict:
    by_project: dict[str, list[Artifact]] = {}
    for artifact in artifacts:
        by_project.setdefault(artifact.project, []).append(artifact)

    projects_with_only_platform_specific = sorted(
        project
        for project, items in by_project.items()
        if not any(item.universal for item in items) and not any(item.kind == "sdist" for item in items)
    )
    projects_requiring_sdists = sorted(
        project for project, items in by_project.items() if any(item.kind == "sdist" for item in items)
    )

    suggestions = {
        project: SUGGESTED_REPLACEMENTS[project]
        for project in requested
        if project in SUGGESTED_REPLACEMENTS
    }

    return {
        "targets": targets,
        "requested_projects": requested,
        "artifact_count": len(artifacts),
        "project_count": len(by_project),
        "projects_with_only_platform_specific_artifacts": projects_with_only_platform_specific,
        "projects_with_sdists": projects_requiring_sdists,
        "replacement_suggestions": suggestions,
        "artifacts": [
            {
                "project": artifact.project,
                "filename": artifact.filename,
                "relative_path": artifact.relative_path,
                "sha256": artifact.sha256,
                "kind": artifact.kind,
                "universal": artifact.universal,
            }
            for artifact in artifacts
        ],
    }


def validate_current_environment(output_dir: Path, requirements_path: Path) -> dict:
    simple_path = (output_dir / SIMPLE_INDEX).resolve().as_posix()
    index_url = f"file:///{simple_path}"
    result = run_capture(
        sys.executable,
        "-m",
        "pip",
        "install",
        "--dry-run",
        "--ignore-installed",
        "--index-url",
        index_url,
        "-r",
        str(requirements_path),
    )
    return {
        "index_url": index_url,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


def main() -> None:
    args = parse_args()
    requirements_path = Path(args.requirements).resolve()
    output_dir = Path(args.output).resolve()

    if not requirements_path.exists():
        raise SystemExit(f"Missing requirements file: {requirements_path}")

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    requested_projects = direct_requirements(requirements_path)
    selected_targets = sorted(set(args.target or DEFAULT_TARGETS))

    with tempfile.TemporaryDirectory(prefix="offline-pypi-", dir=str(ROOT)) as tmp_dir_name:
        stage_dir = Path(tmp_dir_name)

        for target_name in selected_targets:
            download_for_target(requirements_path, stage_dir, target_name, include_sdists=args.include_sdists)

        if args.include_sdists:
            download_sdists(requirements_path, stage_dir)

        artifacts = organize_artifacts(stage_dir, output_dir)

    build_artifactory_index(output_dir, artifacts)
    build_simple_index(output_dir, artifacts)

    summary = summarize_artifacts(artifacts, requested_projects, selected_targets)
    (output_dir / REPORT_NAME).write_text(json.dumps(summary, indent=2), encoding="utf-8")

    if not args.skip_validation:
        validation = validate_current_environment(output_dir, requirements_path)
        (output_dir / VALIDATION_NAME).write_text(json.dumps(validation, indent=2), encoding="utf-8")
        print("Validated current interpreter against the generated simple index.")
    else:
        print("Skipped local validation.")

    print(f"Created offline repository: {output_dir}")
    print(f"Artifactory index: {output_dir / ARTIFACTORY_INDEX}")
    print(f"Simple index: {output_dir / SIMPLE_INDEX}")
    print(f"Targets mirrored: {', '.join(selected_targets)}")

    if summary["projects_with_only_platform_specific_artifacts"]:
        print("Projects that still require platform-specific wheels:")
        for project in summary["projects_with_only_platform_specific_artifacts"]:
            print(f"  - {project}")

    if summary["replacement_suggestions"]:
        print("Suggested direct dependency replacements for better portability:")
        for project, suggestion in summary["replacement_suggestions"].items():
            print(f"  - {project}: {suggestion}")


if __name__ == "__main__":
    main()
