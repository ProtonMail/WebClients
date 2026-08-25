import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

// The shell is a single static asset served from its own origin (same relative-API-subdomain
// convention every other Proton app uses for cross-origin iframes — see getApiSubdomainUrl and
// its callers, e.g. the Chargebee payment iframe). Same path, same bytes, for every artifact,
// every version, every user — see ARTIFACT_SHELL_PROPOSAL.md.
export const ARTIFACT_SHELL_PATH = '/lumo/v1/artifact-shell';

export const ARTIFACT_HTML_MESSAGE = 'lumo-artifact-html';
export const ARTIFACT_RESIZE_MESSAGE = 'lumo-resize';

export function getArtifactShellUrl(): URL {
    return getApiSubdomainUrl(ARTIFACT_SHELL_PATH, window.location.origin);
}
