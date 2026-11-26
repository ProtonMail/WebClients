import { c } from 'ttag';

import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { Maybe, MaybeNull } from '../../../types/utils';
import { BANNER_CADENCE, ONPAGE_CADENCE, shouldPrompt } from './cadence';
import type { PromptDismissal, PromptId } from './types';

/** Runtime conditions a surface must resolve and feed into the
 * projection. Deliberately a plain bag of booleans: definitions stay
 * decoupled from services (`authStore`) and react hooks. */
export type PromptClientConditions = {
    /** Keys on the real offline-capability source of truth
     * (`authStore.hasOfflineComponents()`), not the `offlineEnabled`
     * settings mirror — see 6467's convergence. */
    offlineComponents: boolean;
    /** Setting up offline mode requires an online SRP password check:
     * the prompt is pointless while connectivity is degraded. */
    online: boolean;
};

/** Declarative primary action of a prompt: surfaces map the
 * discriminant to their own behavior (popup banner runs the in-place
 * setup flow; the on-page surface routes through the service worker). */
type PromptPrimaryAction = { action: 'enable-offline'; label: string };

/** Fully-resolved, serializable prompt descriptor: the projection
 * output. Plain object — no components, no thunks — so it can cross
 * contexts (snapshot into the on-page iframe, popup `useSelector`). */
export type PromptDescriptor = {
    id: PromptId;
    title: string;
    body: string;
    primary: PromptPrimaryAction;
    /** Optional auto-dismissable hint shown after a dismissal */
    dismissToast?: string;
};

/** A client-side prompt definition: hardcoded, never stored. Copy and
 * cadence policy live here; the dismissal ledger resolves against it.
 * Copy is resolved lazily via `copy()` — translations load at runtime,
 * so `ttag` strings must always evaluate inside a function. */
export type PromptDefinition = {
    id: PromptId;
    copy: () => Omit<PromptDescriptor, 'id'>;
    cadence: number[];
    eligibility: (client: PromptClientConditions) => boolean;
};

/** Client-side prompt definitions (product decision: the on-page and
 * popup banners are independent notifications over one mechanism). */
export const PROMPT_DEFINITIONS: Record<PromptId, PromptDefinition> = {
    'offline-banner': {
        id: 'offline-banner',
        copy: () => ({
            title: c('Title').t`Enable offline mode`,
            body: c('Info')
                .t`Access your ${PASS_SHORT_APP_NAME} data if you lose internet connectivity or if ${BRAND_NAME} servers are unreachable.`,
            primary: { action: 'enable-offline', label: c('Action').t`Enable offline mode` },
        }),
        cadence: BANNER_CADENCE,
        eligibility: ({ offlineComponents, online }) => !offlineComponents && online,
    },
    'offline-onpage': {
        id: 'offline-onpage',
        copy: () => ({
            title: c('Title').t`Enable offline mode`,
            body: c('Info')
                .t`Access your ${PASS_SHORT_APP_NAME} data if you lose internet connectivity or if ${BRAND_NAME} servers are unreachable.`,
            primary: { action: 'enable-offline', label: c('Action').t`Enable offline mode` },
            dismissToast: c('Info').t`You can turn on offline mode any time in ${BRAND_NAME} Pass settings`,
        }),
        cadence: ONPAGE_CADENCE,
        eligibility: ({ offlineComponents, online }) => !offlineComponents && online,
    },
};

/** The projection: resolves a prompt definition against the dismissal
 * ledger and the client conditions into a plain descriptor, or null
 * when the prompt is not eligible. Pure — cadence resolution composes
 * `shouldPrompt` against `now`. */
export const projectPrompt = (
    id: PromptId,
    dismissal: Maybe<PromptDismissal>,
    client: PromptClientConditions,
    now: number
): MaybeNull<PromptDescriptor> => {
    const definition = PROMPT_DEFINITIONS[id];
    if (!definition || !shouldPrompt(dismissal, definition.cadence, now) || !definition.eligibility(client)) return null;

    return { id, ...definition.copy() };
};
