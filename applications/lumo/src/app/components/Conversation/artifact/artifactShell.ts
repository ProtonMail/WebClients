import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

// The shell is a single static asset served from its own origin (same relative-API-subdomain
// convention every other Proton app uses for cross-origin iframes — see getApiSubdomainUrl and
// its callers, e.g. the Chargebee payment iframe). Same path, same bytes, for every artifact,
// every version, every user — see ARTIFACT_SHELL_PROPOSAL.md.
export const ARTIFACT_SHELL_PATH = '/lumo/v1/artifact-shell';

export const ARTIFACT_HTML_MESSAGE = 'lumo-artifact-html';
export const ARTIFACT_RESIZE_MESSAGE = 'lumo-resize';

export function getArtifactShellUrl(locationOrigin = window.location.origin): URL {
    return getApiSubdomainUrl(ARTIFACT_SHELL_PATH, locationOrigin);
}

/**
 * True when the artifact shell is served from a different origin than the Lumo app.
 * When false (e.g. localhost path-prefix dev), sandboxed iframe preview must not run —
 * allow-same-origin would grant LLM-authored HTML access to Lumo's own storage.
 */
export function isArtifactShellCrossOrigin(locationOrigin = window.location.origin): boolean {
    return getArtifactShellUrl(locationOrigin).origin !== locationOrigin;
}
