import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineCloseOptions } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import { clientStatusResolved } from '@proton/pass/lib/client';
import type { Rect } from '@proton/pass/types/utils/dom';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils/index';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { createStyleParser, getComputedHeight } from '@proton/pass/utils/dom/computed-styles';
import { POPOVER_SUPPORTED } from '@proton/pass/utils/dom/popover';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { omit } from '@proton/shared/lib/helpers/object';

import type { DropdownHandler } from './dropdown.abstract';
import type { DropdownActions, DropdownAnchor, DropdownRequest } from './dropdown.app';

export const onCloseEffects = onNextTick((field: FieldHandle, { refocus, userAction }: InlineCloseOptions) => {
    if (refocus) field.focus({ preventAction: false });
    else if (!userAction && !isActiveElement(field.element)) field.icon?.detach();
});

export const onFocusChangeFactory = (dropdown: DropdownHandler, anchor: DropdownAnchor) =>
    onNextTick(async (_: FocusEvent) => {
        const field = anchor.type === 'field' ? anchor.field : undefined;
        if ((field && isActiveElement(field.element)) || (await dropdown.getState()).focused) return;
        dropdown.close(anchor);
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

export const matchesDropdownAnchor = <T extends DropdownAnchor>(a: Maybe<MaybeNull<DropdownAnchor>>, b: T): boolean => {
    if (!a) return false;

    switch (b.type) {
        case 'field':
            return a.type === b.type && a.field.element === b.field.element;
        case 'frame':
            return a.type === b.type && a.frameId === b.frameId && a.formId === b.formId && a.fieldId === b.fieldId;
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

export const validateDropdownRequest = withContext<(request: DropdownRequest) => Promise<boolean>>(
    async (ctx, request) => {
        if (!ctx) return false;

        const { action, autofocused, autofilled } = request;

        /** Block autofocus requests on previously autofilled fields */
        const validInteraction = !(autofocused && autofilled);
        if (!validInteraction) return false;

        /** If we're refocusing after an unlock request from the dropdown,
         * ensure the client status has resolved before continuing */
        await waitUntil(() => clientStatusResolved(ctx.getState().status), 50);
        const { authorized } = ctx.getState();

        /** If unauthorized and autofocused: cancel request. */
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
        const frameId = request.type === 'frame' ? request.frameId : request.field.frameId;
        const fieldId = request.type === 'frame' ? request.fieldId : request.field.fieldId;
        const formId = request.type === 'frame' ? request.formId : request.field.formId;
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
                    if (res.type === 'error') return;
                    return { action, ...omit(res, ['type']), ...base };
                });
            }
        }
    }
);

export const getDropdownPosition =
    (request: DropdownRequest) =>
    (root: HTMLElement): Partial<Rect> => {
        const position = (() => {
            switch (request.type) {
                case 'field':
                    const { element } = request.field;
                    const boxElement = request.field.getAnchor().element;
                    const boxed = boxElement !== element;
                    const rootRect = POPOVER_SUPPORTED ? { top: 0, left: 0 } : root.getBoundingClientRect();

                    const styles = createStyleParser(boxElement);
                    const computedHeight = getComputedHeight(styles, boxed ? 'inner' : 'outer');
                    const { value: height, offset: offsetBox } = computedHeight;
                    const { left: boxLeft, top: boxTop, width: boxWidth } = boxElement.getBoundingClientRect();

                    return {
                        top: boxTop - rootRect.top + offsetBox.bottom + offsetBox.top + height,
                        left: boxLeft - rootRect.left + boxWidth - DROPDOWN_WIDTH,
                    };
                case 'frame':
                    return request.coords;
            }
        })();

        if (position.left < 0) position.left = 0;
        return position;
    };
