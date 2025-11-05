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
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DropdownHandler } from './dropdown.abstract';
import type { DropdownActions, DropdownAnchor, DropdownRequest } from './dropdown.app';

export const onCloseEffects = onNextTick((field: FieldHandle, { refocus, preventAction }: InlineCloseOptions) => {
    if (refocus) field.focus({ preventAction });
    else if (!preventAction && !isActiveElement(field.element)) field.icon?.detach();
});

export const onFocusChangeFactory = (dropdown: DropdownHandler, field?: FieldHandle) =>
    onNextTick(async (_: Event) => {
        if (field && isActiveElement(field?.element)) return;
        else {
            if ((await dropdown.getState()).focused) return;
            if (!document.hasFocus()) field?.icon?.detach();
            dropdown.close(field ? { type: 'field', field } : undefined);
        }
    });

export const onBackdropClick = (getField: () => Maybe<FieldHandle>, effect: () => void) => (evt: Event) => {
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

export const willDropdownAnchorChange = (
    anchor: Maybe<MaybeNull<DropdownAnchor>>,
    payload: DropdownRequest
): boolean => {
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

/** Resolves origin based on autofill action requirements:
 * - CC autofill: uses domain for loose cross-frame matching across subdomains
 * - Other actions: uses subdomain for strict origin matching */
export const resolveDropdownOrigins = (
    request: DropdownRequest,
    url: ParsedUrl
): MaybeNull<[origin: string, frameOrigin: string]> => {
    const domain = resolveDomain(url);
    const subdomain = resolveSubdomain(url);

    switch (request.action) {
        case DropdownAction.AUTOFILL_CC:
            if (!domain) return null;
            return request.type === 'frame' ? [domain, request.origin] : [domain, domain];
        default:
            if (!subdomain) return null;
            return request.type === 'frame' ? [subdomain, request.origin] : [subdomain, subdomain];
    }
};

export const dropdownRequestGuard = withContext<(request: DropdownRequest) => Promise<boolean>>(
    async (ctx, request) => {
        if (!ctx) return false;

        /** If we're refocusing after an unlock request from the dropdown,
         * ensure the client status has resolved before continuing */
        await waitUntil(() => clientStatusResolved(ctx.getState().status), 50);

        const { action, autofocused } = request;
        const { authorized } = ctx.getState();
        if (autofocused && !authorized) return false;

        const url = ctx.getExtensionContext()?.url;

        switch (action) {
            case DropdownAction.AUTOFILL_CC:
                return !(autofocused && !(await ctx.service.autofill.getCreditCardsCount()));
            case DropdownAction.AUTOFILL_IDENTITY:
                return !(autofocused && !(await ctx.service.autofill.getIdentitiesCount()));
            case DropdownAction.AUTOFILL_LOGIN:
                return !(autofocused && !(await ctx.service.autofill.getCredentialsCount()));
            case DropdownAction.AUTOSUGGEST_ALIAS:
                return Boolean(url?.displayName);
            default:
                return true;
        }
    }
);

export const intoDropdownAction = withContext<(request: DropdownRequest) => Promise<Maybe<DropdownActions>>>(
    async (ctx, request) => {
        if (!ctx) return;

        const { action } = request;
        const url = ctx.getExtensionContext()?.tabUrl;
        const frameId = request.type === 'frame' ? request.fieldFrameId : 0;
        const fieldId = request.type === 'frame' ? request.fieldId : request.field.fieldId;
        const formId = request.type === 'frame' ? request.formId : request.field.getFormHandle().formId;
        const origins = url ? resolveDropdownOrigins(request, url) : null;

        if (!(url && origins)) return;

        const [origin, frameOrigin] = origins;
        const base = { frameOrigin, frameId, fieldId, formId, origin } as const;

        switch (action) {
            case DropdownAction.AUTOFILL_CC:
                return { action, ...base };
            case DropdownAction.AUTOFILL_IDENTITY:
                return { action, ...base };
            case DropdownAction.AUTOFILL_LOGIN:
                return { action, ...base, startsWith: '' };
            case DropdownAction.AUTOSUGGEST_ALIAS:
                if (!url.displayName) return;
                return { action, prefix: deriveAliasPrefix(url.displayName), ...base };
            case DropdownAction.AUTOSUGGEST_PASSWORD: {
                return sendMessage.on(contentScriptMessage({ type: WorkerMessageType.AUTOSUGGEST_PASSWORD }), (res) => {
                    if (res.type === 'error') throw new Error(res.error);
                    return { action, ...omit(res, ['type']), ...base };
                });
            }
        }
    }
);
