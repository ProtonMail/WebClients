import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineCloseOptions } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import { clientStatusResolved } from '@proton/pass/lib/client';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { DOM_SETTLE_MS, nextTick } from '@proton/pass/utils/time/next-tick';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DropdownHandler } from './dropdown.abstract';
import type { DropdownActions, DropdownAnchor, DropdownRequest } from './dropdown.app';

/** Handles field cleanup when dropdown closes, preventing race conditions.
 *
 * refocus=true: Immediately re-focus field to re-open dropdown (e.g., after unlock)
 * refocus=false: Clean up by detaching icon if field is inactive and no preventAction set
 *
 * `preventAction` temporarily blocks field interactions for DOM_SETTLE_MS (~42ms) to
 * prevent conflicting side-effects during close/focus transitions. This timing covers
 * async cross-frame messaging and ensures clean state transitions (see `handleAutoClose`).
 *
 * `nextTick` defers operations until DOM has stabilized. */
export const handleOnClosed = (field: FieldHandle, { refocus, preventAction }: InlineCloseOptions) => {
    if (!refocus || preventAction) field.preventAction(DOM_SETTLE_MS);
    nextTick(() => {
        if (refocus) field.focus({ preventAction });
        else if (!preventAction && !isActiveElement(field.element)) field.icon?.detach();
    });
};

/** Returns event handler that auto-closes dropdown on focus/blur events.
 *
 * `preventAction` blocks field interactions immediately because window focus/blur events
 * trigger BEFORE field events in cross-frame scenarios. When a sub-frame field is
 * re-focused, the window focus handler triggers first, preventing unwanted field
 * side-effects when user refocuses field after interacting with dropdown cross-frame.
 *
 * `nextTick` evaluates close conditions after DOM settles:
 * - Preserves dropdown if it acquired focus during the focus change
 * - Detaches icon and closes if document lost focus
 * - Otherwise closes dropdown normally */
export const handleAutoClose = (dropdown: DropdownHandler, field?: FieldHandle) => {
    return (_: Event) => {
        field?.preventAction(DOM_SETTLE_MS);
        nextTick(async () => {
            if ((await dropdown.getState()).focused) return;
            if (!document.hasFocus()) field?.icon?.detach();
            dropdown.close(field ? { type: 'field', field } : undefined);
        });
    };
};

export const handleBackdrop = (getField: () => Maybe<FieldHandle>, effect: () => void) => (evt: Event) => {
    const target = evt.target as MaybeNull<HTMLElement>;

    const excluded = (() => {
        const field = getField();
        if (!field) return [];
        const rootNode = field.element.getRootNode();
        const host = isShadowRoot(rootNode) ? rootNode.host : null;
        return [field.icon?.element, field.element, host].filter(truthy);
    })();

    if (!target || !excluded.includes(target)) effect();
};

/** Resolves origin based on autofill action requirements:
 * - CC autofill: uses domain for loose cross-frame matching across subdomains
 * - Other actions: uses subdomain for strict origin matching */
export const resolveDropdownOrigin = (request: DropdownRequest, url: ParsedUrl): MaybeNull<string> => {
    const domain = resolveDomain(url);
    const subdomain = resolveSubdomain(url);

    switch (request.action) {
        case DropdownAction.AUTOFILL_CC:
            return request.type === 'frame' ? request.origin : domain;
        default:
            return request.type === 'frame' ? request.origin : subdomain;
    }
};

/** Prepares dropdown payload with authorization and item count validation.
 * Returns `undefined` to cancel invalid requests. For focus-triggered login/identity
 * autofill, validates `item count > 0` before proceeding. Waits for client status
 * resolution after unlock requests for proper refocus. */
export const prepareDropdownAction = withContext<(request: DropdownRequest) => Promise<Maybe<DropdownActions>>>(
    async (ctx, request) => {
        if (!ctx) return;

        /** If we're refocusing after an unlock request from the dropdown,
         * ensure the client status has resolved before continuing */
        await waitUntil(() => clientStatusResolved(ctx.getState().status), 50);

        const { action, autofocused } = request;
        const { authorized } = ctx.getState();
        if (autofocused && !authorized) return;

        const url = ctx.getExtensionContext()?.url;
        const origin = url ? resolveDropdownOrigin(request, url) : null;
        if (!origin) return;

        const frameId = request.type === 'frame' ? request.fieldFrameId : 0;
        const fieldId = request.type === 'frame' ? request.fieldId : request.field.fieldId;
        const formId = request.type === 'frame' ? request.formId : request.field.getFormHandle().formId;
        const base = { origin, frameId, fieldId, formId } as const;

        switch (action) {
            case DropdownAction.AUTOFILL_CC: {
                if (autofocused && !(await ctx.service.autofill.getCreditCardsCount())) return;
                return { action, ...base };
            }

            case DropdownAction.AUTOFILL_IDENTITY: {
                if (autofocused && !(await ctx.service.autofill.getIdentitiesCount())) return;
                return { action, ...base };
            }

            case DropdownAction.AUTOFILL_LOGIN: {
                if (autofocused && !(await ctx.service.autofill.getCredentialsCount())) return;
                if (!authorized) return { action, ...base, origin: '', startsWith: '' };
                return { action, ...base, startsWith: '' };
            }
            case DropdownAction.AUTOSUGGEST_ALIAS: {
                if (!url?.displayName) throw new Error();
                return { action, prefix: deriveAliasPrefix(url.displayName), ...base };
            }
            case DropdownAction.AUTOSUGGEST_PASSWORD: {
                return sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOSUGGEST_PASSWORD }), (res) => {
                    if (res.type === 'error') throw new Error(res.error);
                    return { action, ...omit(res, ['type']), ...base };
                });
            }
        }
    }
);

export const willDropdownAnchorChange = (anchor: DropdownAnchor, payload: DropdownRequest): boolean => {
    if (!anchor) return true;

    switch (payload.type) {
        case 'field':
            return anchor.type !== 'field' || anchor.field.element !== payload.field.element;

        case 'frame':
            return (
                anchor.type !== 'frame' ||
                anchor.fieldFrameId !== payload.fieldFrameId ||
                anchor.fieldId !== payload.fieldId
            );
    }
};
