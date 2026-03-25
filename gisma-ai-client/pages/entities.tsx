import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { IconArrowLeft, IconBraces, IconCopy, IconMaximize, IconX } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import ParticlesBackground from '@/components/Global/Particles';
import LoadingSpinner from '@/components/Global/LoadingSpinner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getUser } from '@/store/slices/authSlice';
import { api, handleAxiosError } from '@/utils/api';
import { API_ENTITY_TYPES, ApiEntityType } from '@/constants/apiEntityTypes';

type PromptApiResponse = {
  response: string;
};

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

  const [entityType, setEntityType] = useState<ApiEntityType>(API_ENTITY_TYPES[0]);
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
        { prompt, entityType },
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
                Choose an entity type, enter a filter, then fetch JSON from the backend.
              </p>
            </div>

            <div className="min-w-0 max-w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 shadow-xl backdrop-blur-xl sm:p-6">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="block text-sm font-medium text-blue-200/90" htmlFor="entity-type">
                    Entity type
                  </label>
                  <select
                    id="entity-type"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as ApiEntityType)}
                    className="w-full cursor-pointer rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {API_ENTITY_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-gray-900">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 flex-[2] space-y-2">
                  <label className="block text-sm font-medium text-blue-200/90" htmlFor="filter">
                    Filter
                  </label>
                  <input
                    id="filter"
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="e.g. names matching Maya, or all students"
                    className="w-full min-w-0 rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                  className="flex h-[46px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-medium text-white shadow-lg transition-all duration-apple hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[46px]"
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
                Sends <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">POST /prompt/api</code> with your filter as <code className="font-mono text-[11px]">prompt</code> and the selected entity type.
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
