import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { nextTick } from '@proton/pass/utils/time/next-tick';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DropdownActions, DropdownRequest } from './dropdown.app';
import { DROPDOWN_FOCUS_TIMEOUT } from './dropdown.focus';

/** Handles field cleanup when dropdown closes, preventing race conditions.
 * Uses actionTrap to block interactions during transitions and nextTick
 * to ensure DOM state has settled before focus/icon operations. */
export const onFieldDropdownClose = (field: FieldHandle, refocus: boolean) => {
    if (!refocus) actionTrap(field.element, DROPDOWN_FOCUS_TIMEOUT);

    nextTick(() => {
        if (refocus) field.focus();
        else if (!isActiveElement(field.element)) field.detachIcon();
    });
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

        const { action, autofocused } = request;
        const url = ctx.getExtensionContext()?.url;
        const origin = url ? resolveDropdownOrigin(request, url) : null;
        const frameId = request.type === 'frame' ? request.fieldFrameId : 0;

        if (!origin) return;

        const { authorized } = ctx.getState();

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
