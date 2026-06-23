import type { FrameId } from '@proton/pass/types/worker/runtime';

import type { CCItemPreview, IdentityItemPreview, LoginItemPreview } from './data';

export type AutofillLoginResult = { items: LoginItemPreview[]; needsUpgrade: boolean };
export type AutofillIdentityResult = { items: IdentityItemPreview[]; needsUpgrade: boolean };
export type AutofillCCResult = { items: CCItemPreview[]; needsUpgrade: boolean };

export type AutofillQueryFilter = {
    /** Explicit `domain` filter, takes precedence over any frame
     * resolution. When omitted, candidates are scoped to the target
     * frameId or, if that is also omitted, the sender's own frame URL. */
    domain?: string;
    /** Candidates should only be included in
     * writable vaults (for autosave purposes).  */
    writable?: boolean;
    /** Target Frame ID during cross-frame autofill. Resolved
     * worker-side to its origin. When omitted, the sender's own
     * frame URL is trusted (in-frame content-script query). */
    frameId?: FrameId;
};
