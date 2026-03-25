/** Keys aligned with `API_BASES_BY_ENTITY_TYPE` in the subagents `api_toolkit` module. */
export const API_ENTITY_TYPES = ['students'] as const;

export type ApiEntityType = (typeof API_ENTITY_TYPES)[number];
