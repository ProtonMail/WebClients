import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import { clientStatusResolved } from '@proton/pass/lib/client';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { nextTick, onNextTick } from '@proton/pass/utils/time/next-tick';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DropdownHandler } from './dropdown.abstract';
import type { DropdownActions, DropdownAnchor, DropdownRequest } from './dropdown.app';

/** Handles field cleanup when dropdown closes, preventing race conditions.
 * Uses actionTrap to block interactions during transitions and nextTick
 * to ensure DOM state has settled before focus/icon operations. */
export const handleOnClosed = (field: FieldHandle, refocus: boolean) => {
    if (!refocus) actionTrap(field.element, 1);
    nextTick(() => {
        if (refocus) field.focus();
        else if (!isActiveElement(field.element)) field.detachIcon();
    });
};

export const handleAutoClose = (dropdown: DropdownHandler, field?: FieldHandle) =>
    onNextTick(
        withContext(async (ctx) => {
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

/** Depending on the autofill action type, origin should be adapted.
 * In the case of CC autofill, we apply loose domain checking to support
 * cross-frame autofilling on different subdomain for the same tld.*/
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

/** Processes a dropdown request to create a usable payload for the injected dropdown.
 * Returns undefined to cancel if the request is invalid. For login/identity autofill
 * triggered by a focus event, ensures a valid item count exists before proceeding. */
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
        const frameId = request.type === 'frame' ? request.fieldFrameId : 0;

        if (!origin) return;

        switch (action) {
            case DropdownAction.AUTOFILL_CC: {
                if (autofocused && !(await ctx.service.autofill.getCreditCardsCount())) return;
                if (!authorized) return { action, origin, frameId };
                return { action, origin, frameId };
            }

            case DropdownAction.AUTOFILL_IDENTITY: {
                if (autofocused && !(await ctx.service.autofill.getIdentitiesCount())) return;
                if (!authorized) return { action, origin: '', frameId };
                return { action, origin, frameId };
            }

            case DropdownAction.AUTOFILL_LOGIN: {
                if (autofocused && !(await ctx.service.autofill.getCredentialsCount())) return;
                if (!authorized) return { action, origin: '', startsWith: '', frameId };
                return { action, origin, startsWith: '', frameId };
            }
            case DropdownAction.AUTOSUGGEST_ALIAS: {
                if (!url?.displayName) throw new Error();
                return { action, origin, frameId, prefix: deriveAliasPrefix(url.displayName) };
            }
            case DropdownAction.AUTOSUGGEST_PASSWORD: {
                return sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOSUGGEST_PASSWORD }), (res) => {
                    if (res.type === 'error') throw new Error(res.error);
                    return { action, origin, frameId, ...omit(res, ['type']) };
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
