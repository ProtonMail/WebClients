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
import { nextTick, onNextTick } from '@proton/pass/utils/time/next-tick';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DropdownHandler } from './dropdown.abstract';
import type { DropdownActions, DropdownAnchor, DropdownRequest } from './dropdown.app';

/** Handles field cleanup when dropdown closes with race condition prevention.
 * - If `!refocus`: blocks field interactions for 1ms to prevent transition conflicts
 * - Uses nextTick for DOM stability before focus/icon operations
 * - Conditionally detaches icon only if field is not currently active */
export const handleOnClosed = (field: FieldHandle, { refocus, preventAction }: InlineCloseOptions) => {
    if (!refocus || preventAction) field.preventAction(1);
    nextTick(() => {
        if (refocus) field.focus({ preventAction });
        else if (!isActiveElement(field.element)) field.icon?.detach();
    });
};

/** Auto-close prevention handler for focus/blur events:
 * - Autofill sequences (ctx.service.autofill.processing = true)
 * - Dropdown focus transitions (getState().focused = true)
 * - Uses onNextTick to ensure DOM state has settled before evaluation. */
export const handleAutoClose = (dropdown: DropdownHandler, field?: FieldHandle) =>
    onNextTick(
        withContext<() => void>(async (ctx) => {
            const autofilling = ctx?.service.autofill.processing ?? false;
            const dropdownFocused = (await dropdown.getState()).focused;
            if (!(autofilling || dropdownFocused)) dropdown.close(field ? { type: 'field', field } : undefined);
        })
    );

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
