import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {
  IconArrowLeft,
  IconBraces,
  IconChevronDown,
  IconCopy,
  IconMap,
  IconMaximize,
  IconPlayerStop,
  IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ParticlesBackground from '@/components/Global/Particles';
import LoadingSpinner from '@/components/Global/LoadingSpinner';
import MapPage from '@/components/MapPage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getUser } from '@/store/slices/authSlice';
import { api, handleAxiosError } from '@/utils/api';

type PromptApiResponse = {
  response: string;
};

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

function isValidJsonDisplayString(s: string): boolean {
  const t = s.trim();
  try {
    JSON.parse(t);
    return true;
  } catch {
    try {
      JSON.parse(t.replace(/^```json\s*/i, '').replace(/```\s*$/, ''));
      return true;
    } catch {
      return false;
    }
  }
}

type JsonSyntaxViewProps = {
  value: string;
  /** compact: panel; comfortable: full-screen modal */
  density?: 'compact' | 'comfortable';
};

const JsonSyntaxView: React.FC<JsonSyntaxViewProps> = ({ value, density = 'compact' }) => {
  const validJson = useMemo(() => isValidJsonDisplayString(value), [value]);
  const fontClass =
    density === 'comfortable'
      ? 'text-[11px] leading-relaxed sm:text-sm'
      : 'text-[11px] leading-relaxed sm:text-xs';

  if (!validJson) {
    return (
      <pre
        className={`m-0 box-border block w-max max-w-none font-mono ${fontClass} whitespace-pre text-emerald-100/95`}
      >
        {value}
      </pre>
    );
  }

  return (
    <SyntaxHighlighter
      language="json"
      style={darcula}
      showLineNumbers
      lineNumberStyle={{
        minWidth: '2.25rem',
        paddingRight: '0.75rem',
        color: 'rgba(255,255,255,0.22)',
        fontSize: '0.7em',
        userSelect: 'none',
      }}
      customStyle={{
        margin: 0,
        padding: 0,
        background: 'transparent',
      }}
      codeTagProps={{
        className: `font-mono ${fontClass}`,
        style: { display: 'block', width: 'max-content', minWidth: '100%' },
      }}
      wrapLines={false}
    >
      {value}
    </SyntaxHighlighter>
  );
};

const selectClass =
  'h-8 min-w-[10.5rem] w-[11rem] shrink-0 cursor-pointer appearance-none rounded-xl border border-zinc-600/50 bg-zinc-950/90 px-2 pr-7 text-xs font-medium text-zinc-100 shadow-inner shadow-black/40 transition-colors duration-200 hover:border-zinc-500/70 hover:bg-zinc-900/95 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 [color-scheme:dark] sm:h-9 sm:min-w-[13rem] sm:w-[14rem] sm:px-2.5 sm:pr-8 sm:text-sm';

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

  const [mainView, setMainView] = useState<'json' | 'map'>('json');

  const fetchAbortRef = useRef<AbortController | null>(null);
  const filterTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    const el = filterTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxPx = 160;
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
  }, [filter]);

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

  const handleStopFetch = () => {
    fetchAbortRef.current?.abort();
  };

  const handleFetch = async () => {
    setError(null);
    setResultText(null);
    const prompt = filter.trim();
    if (!prompt) {
      setError('Enter a filter describing what to fetch.');
      return;
    }
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);
    try {
      const { data } = await api.post<PromptApiResponse>(
        '/prompt/api',
        { prompt, entityType, service },
        { timeout: 120000, signal: controller.signal }
      );
      setResultText(formatJsonBlock(data.response));
    } catch (e) {
      if (axios.isCancel(e) || (axios.isAxiosError(e) && e.code === 'ERR_CANCELED')) {
        return;
      }
      setError(handleAxiosError(e));
    } finally {
      if (fetchAbortRef.current === controller) {
        fetchAbortRef.current = null;
        setLoading(false);
      }
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

      <div className="relative flex h-screen min-h-0 w-full max-w-full flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-slate-950 to-black">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ParticlesBackground />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 left-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl sm:left-4" />
          <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl sm:right-4" />
        </div>
        <div className="absolute inset-0 z-0 overflow-hidden bg-grid opacity-30 mask-radial-faded" />

        <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="mx-auto flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 overflow-hidden sm:gap-3">
            <div className="shrink-0 rounded-[1.35rem] border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[1.6rem] sm:px-3.5 sm:py-2.5">
              <div className="flex min-h-0 min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={goBack}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/75 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-[0.96] sm:p-2"
                  aria-label="Back to chat"
                >
                  <IconArrowLeft className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                </button>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 ring-1 ring-blue-400/25 sm:h-9 sm:w-9">
                    <IconBraces className="h-4 w-4 text-blue-300 sm:h-[18px] sm:w-[18px]" />
                  </div>
                  <h1 className="max-w-[6.5rem] truncate text-sm font-semibold tracking-tight text-white sm:max-w-[11rem] sm:text-base">
                    API entities
                  </h1>
                </div>

                <div className="group relative shrink-0">
                  <label htmlFor="service" className="sr-only">
                    Service
                  </label>
                  <select
                    id="service"
                    value={service}
                    onChange={(e) => {
                      const name = e.target.value;
                      setService(name);
                      const entities = entitiesByService[name] ?? [];
                      setEntityType(entities[0] ?? '');
                    }}
                    className={selectClass}
                  >
                    {serviceNames.map((name) => (
                      <option key={name} value={name} className="bg-zinc-950 text-zinc-100">
                        {name}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown
                    className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500 sm:right-2 sm:h-3.5 sm:w-3.5"
                    aria-hidden
                  />
                </div>

                <div className="group relative shrink-0">
                  <label htmlFor="entity-type" className="sr-only">
                    Entity type
                  </label>
                  <select
                    id="entity-type"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className={selectClass}
                  >
                    {(entitiesByService[service] ?? []).map((t) => (
                      <option key={t} value={t} className="bg-zinc-950 text-zinc-100">
                        {t}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown
                    className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500 sm:right-2 sm:h-3.5 sm:w-3.5"
                    aria-hidden
                  />
                </div>

                <div className="flex min-h-0 min-w-[8rem] flex-1 items-center sm:min-w-[12rem]">
                  <label htmlFor="filter" className="sr-only">
                    Filter
                  </label>
                  <textarea
                    ref={filterTextareaRef}
                    id="filter"
                    rows={1}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter prompt…"
                    className="box-border min-h-8 w-full min-w-0 max-h-40 resize-none overflow-y-auto rounded-xl border border-zinc-600/50 bg-zinc-950/90 px-2.5 py-1.5 text-xs leading-snug text-zinc-100 shadow-inner shadow-black/40 placeholder:text-zinc-500 transition-colors duration-200 hover:border-zinc-500/70 hover:bg-zinc-900/95 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 [color-scheme:dark] [-ms-overflow-style:none] [scrollbar-width:none] sm:min-h-9 sm:px-3 sm:py-2 sm:text-sm [&::-webkit-scrollbar]:hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFetch();
                      }
                    }}
                  />
                </div>

                {loading && (
                  <button
                    type="button"
                    onClick={handleStopFetch}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 text-xs font-medium text-white/75 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-[0.96] sm:h-9 sm:gap-2 sm:px-3 sm:text-sm"
                    aria-label="Stop request"
                    title="Stop request"
                  >
                    <IconPlayerStop className="h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" stroke={1.5} />
                    <span className="hidden sm:inline">Stop request</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={loading}
                  className="flex h-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-3.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-200 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:px-5 sm:text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">Fetching…</span>
                    </span>
                  ) : (
                    'Fetch'
                  )}
                </button>

                <div
                  className="inline-flex shrink-0 rounded-full border border-white/[0.12] bg-black/30 p-0.5 shadow-inner backdrop-blur-md"
                  role="tablist"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mainView === 'json'}
                    onClick={() => setMainView('json')}
                    className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold transition-all sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                      mainView === 'json'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/35'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/85'
                    }`}
                  >
                    <IconBraces className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    JSON
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mainView === 'map'}
                    onClick={() => setMainView('map')}
                    className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold transition-all sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
                      mainView === 'map'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/35'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/85'
                    }`}
                  >
                    <IconMap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Map
                  </button>
                </div>
              </div>
            </div>

            {mainView === 'json' && (
              <p className="shrink-0 text-[11px] text-white/40 sm:text-xs">
                Sends <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/65">POST /prompt/api</code>
                <span className="mx-1 text-white/20">·</span>
                catalog{' '}
                <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/65">GET /prompt/api/catalog</code>
              </p>
            )}

            {error && (
              <div className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            {mainView === 'json' ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
                      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4">
                        <JsonSyntaxView value={resultText} density="compact" />
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
                            <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 sm:p-4">
                              <JsonSyntaxView value={resultText} density="comfortable" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <MapPage />
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default EntitiesPage;
