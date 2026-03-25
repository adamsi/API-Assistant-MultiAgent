import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  IconArrowLeft,
  IconBraces,
  IconChevronDown,
  IconCopy,
  IconMaximize,
  IconX,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import ParticlesBackground from '@/components/Global/Particles';
import LoadingSpinner from '@/components/Global/LoadingSpinner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getUser } from '@/store/slices/authSlice';
import { api, handleAxiosError } from '@/utils/api';

type PromptApiResponse = {
  response: string;
};

/** Until GET /prompt/api/catalog succeeds, same as before: one service + entity. */
const DEFAULT_MAP: Record<string, string[]> = { students: ['students'] };

function formatJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    try {
      return JSON.stringify(JSON.parse(trimmed.replace(/^```json\s*/i, '').replace(/```\s*$/, '')), null, 2);
    } catch {
      return raw;
    }
  }
}

const EntitiesPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { lastVisitedChatId } = useAppSelector((state) => state.chatMemory);

  const [entitiesByService, setEntitiesByService] = useState(DEFAULT_MAP);
  const [serviceNames, setServiceNames] = useState<string[]>(() => Object.keys(DEFAULT_MAP).sort());
  const [service, setService] = useState('students');
  const [entityType, setEntityType] = useState('students');
  const [filter, setFilter] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(getUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) return;
    api
      .get<Array<{ name: string; entityTypes: string[] }>>('/prompt/api/catalog')
      .then(({ data }) => {
        const map: Record<string, string[]> = {};
        for (const row of data ?? []) {
          if (row?.name) map[row.name] = row.entityTypes ?? [];
        }
        if (Object.keys(map).length === 0) return;
        const names = Object.keys(map).sort();
        const first = names[0];
        setEntitiesByService(map);
        setServiceNames(names);
        setService(first);
        setEntityType(map[first]?.[0] ?? '');
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/home');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isJsonModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsJsonModalOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isJsonModalOpen]);

  const goBack = () => {
    if (lastVisitedChatId) {
      router.push(`/chat/${lastVisitedChatId}`);
    } else {
      router.push('/');
    }
  };

  const copyJson = async () => {
    if (resultText == null) return;
    try {
      await navigator.clipboard.writeText(resultText);
      toast.success('JSON copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleFetch = async () => {
    setError(null);
    setResultText(null);
    const prompt = filter.trim();
    if (!prompt) {
      setError('Enter a filter describing what to fetch.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<PromptApiResponse>(
        '/prompt/api',
        { prompt, entityType, service },
        { timeout: 120000 }
      );
      setResultText(formatJsonBlock(data.response));
    } catch (e) {
      setError(handleAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-slate-950 to-black">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>API entities | Gisma Agent</title>
        <meta name="description" content="Fetch JSON entities by type and filter" />
      </Head>

      <div className="relative flex h-screen min-h-0 w-full max-w-full flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-slate-950 to-black sm:flex-row">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ParticlesBackground />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 left-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl sm:left-4" />
          <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl sm:right-4" />
        </div>
        <div className="absolute inset-0 z-0 overflow-hidden bg-grid opacity-30 mask-radial-faded" />

        <aside className="relative z-10 flex w-full min-w-0 max-w-full flex-shrink-0 flex-row items-center gap-3 overflow-hidden border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-2xl sm:w-56 sm:max-w-none sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl p-2 text-white/70 transition-all duration-apple hover:bg-white/10 hover:text-white active:scale-[0.95]"
              aria-label="Back to chat"
            >
              <IconArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shadow-lg">
              <img src="/sa-logo.png" alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-8">
          <div className="mx-auto flex min-h-0 min-w-0 w-full max-w-4xl flex-1 flex-col gap-6 overflow-hidden">
            <div className="min-w-0 shrink-0">
              <h1 className="inline-flex min-w-0 max-w-full items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
                <IconBraces className="h-7 w-7 shrink-0 text-blue-400" />
                API entities
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Choose a service and entity type, enter a filter, then fetch JSON from the backend.
              </p>
            </div>

            <div className="min-w-0 max-w-full shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/35 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45"
                    htmlFor="service"
                  >
                    Service
                  </label>
                  <div className="group relative">
                    <select
                      id="service"
                      value={service}
                      onChange={(e) => {
                        const name = e.target.value;
                        setService(name);
                        const entities = entitiesByService[name] ?? [];
                        setEntityType(entities[0] ?? '');
                      }}
                      className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-zinc-700/80 bg-zinc-950 px-3.5 pr-10 text-sm font-medium text-zinc-100 shadow-inner shadow-black/50 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-900 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/25 [color-scheme:dark]"
                    >
                      {serviceNames.map((name) => (
                        <option key={name} value={name} className="bg-zinc-950 text-zinc-100">
                          {name}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-zinc-400"
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45"
                    htmlFor="entity-type"
                  >
                    Entity type
                  </label>
                  <div className="group relative">
                    <select
                      id="entity-type"
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-zinc-700/80 bg-zinc-950 px-3.5 pr-10 text-sm font-medium text-zinc-100 shadow-inner shadow-black/50 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-900 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/25 [color-scheme:dark]"
                    >
                      {(entitiesByService[service] ?? []).map((t) => (
                        <option key={t} value={t} className="bg-zinc-950 text-zinc-100">
                          {t}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-zinc-400"
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-[2] space-y-1.5">
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45"
                    htmlFor="filter"
                  >
                    Filter
                  </label>
                  <input
                    id="filter"
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="e.g. names matching Maya, or all students"
                    className="h-11 w-full min-w-0 rounded-lg border border-zinc-700/80 bg-zinc-950 px-3.5 text-sm text-zinc-100 shadow-inner shadow-black/50 placeholder:text-zinc-500 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-900 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/25 [color-scheme:dark]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFetch();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={loading}
                  className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-200 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 hover:shadow-[0_6px_24px_rgba(37,99,235,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Fetching…
                    </span>
                  ) : (
                    'Fetch'
                  )}
                </button>
              </div>

              <p className="mt-3 text-xs text-white/40">
                Sends <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">POST /prompt/api</code> with{' '}
                <code className="font-mono text-[11px]">prompt</code>, <code className="font-mono text-[11px]">service</code>, and{' '}
                <code className="font-mono text-[11px]">entityType</code>. Catalog loads from{' '}
                <code className="font-mono text-[11px]">GET /prompt/api/catalog</code> when available.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
            </div>

            {resultText !== null && (
              <>
                <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-inner backdrop-blur-xl">
                  <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                      Response
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={copyJson}
                        className="flex items-center gap-1.5 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        title="Copy JSON"
                      >
                        <IconCopy className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                        <span className="hidden text-xs sm:inline">Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsJsonModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        title="View full screen"
                      >
                        <IconMaximize className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                        <span className="hidden text-xs sm:inline">Full screen</span>
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto">
                    <pre className="m-0 box-border block w-max max-w-none p-3 font-mono text-[11px] leading-relaxed whitespace-pre text-emerald-100/95 sm:p-4 sm:text-xs">
                      {resultText}
                    </pre>
                  </div>
                </div>

                {isJsonModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden p-0">
                    <div
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                      onClick={() => setIsJsonModalOpen(false)}
                    />
                    <div
                      className="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-col border border-white/30 bg-gray-950/95 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:h-[90vh] sm:max-h-[90vh] sm:w-[90vw] sm:max-w-[min(90vw,1400px)] sm:rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
                        <h2 className="min-w-0 truncate text-base font-semibold text-white sm:text-xl">
                          Response
                        </h2>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={copyJson}
                            className="flex items-center gap-1.5 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
                            title="Copy JSON"
                          >
                            <IconCopy className="h-5 w-5" />
                            <span className="hidden text-sm sm:inline">Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsJsonModalOpen(false)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
                            aria-label="Close"
                          >
                            <IconX className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-gray-800/50 via-gray-700/40 to-gray-800/50 p-3 sm:p-4">
                        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                          <pre className="m-0 box-border block w-max max-w-none p-4 font-mono text-[11px] leading-relaxed whitespace-pre text-emerald-100/95 sm:text-sm">
                            {resultText}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default EntitiesPage;
