import { DROPDOWN_IFRAME_SRC, DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_MIN_HEIGHT, DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/services/iframes/messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import type {
    InlineFieldTarget,
    InlineFrameTarget,
} from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import type { WithAutofillOrigin } from 'proton-pass-extension/types/autofill';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { Coords, Maybe, MaybeNull } from '@proton/pass/types';
import { createStyleParser, getComputedHeight } from '@proton/pass/utils/dom/computed-styles';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { resolveDomain, resolveSubdomain } from '@proton/pass/utils/url/utils';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';
import noop from '@proton/utils/noop';

import type { IFrameAppService } from './factory';
import { createIFrameApp } from './factory';

export type DropdownAnchor = InlineFieldTarget | InlineFrameTarget;
type DropdownAnchorRef = { current: MaybeNull<DropdownAnchor> };
type DropdownOptions = { popover: PopoverController; onDestroy: () => void };

export type DropdownActions = WithAutofillOrigin<
    | { action: DropdownAction.AUTOFILL_CC }
    | { action: DropdownAction.AUTOFILL_IDENTITY }
    | { action: DropdownAction.AUTOFILL_LOGIN; startsWith: string }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; prefix: string }
    | ({ action: DropdownAction.AUTOSUGGEST_PASSWORD } & PasswordAutosuggestOptions)
>;

export type DropdownRequest = {
    action: DropdownAction;
    /** Indicates that the request was triggered from a focus event */
    autofocused: boolean;
} & (InlineFieldTarget | InlineFrameTarget<{ coords: Coords; origin: string }>);

export interface InjectedDropdown extends IFrameAppService<DropdownRequest> {
    getCurrentAnchor: () => MaybeNull<DropdownAnchor>;
}

export const createDropdown = ({ popover, onDestroy }: DropdownOptions): InjectedDropdown => {
    const anchor: DropdownAnchorRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createIFrameApp<DropdownAction>({
        animation: 'fadein',
        backdropClose: true,
        id: 'dropdown',
        popover,
        src: DROPDOWN_IFRAME_SRC,
        onDestroy: () => {
            anchor.current = null;
            listeners.removeAll();
            onDestroy();
        },
        onError: () => iframe.destroy(),

        onOpen: () => {
            const target = anchor.current;
            if (target?.type === 'frame') {
                const { formId, fieldId, fieldFrameId } = target;
                void sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_OPENED,
                        payload: { fieldFrameId, formId, fieldId },
                    })
                );
            }
        },

        onClose: (_, options) => {
            const target = anchor.current;

            switch (target?.type) {
                case 'field': {
                    if (options.refocus) target.field.focus();
                    else if (!isActiveElement(target.field.element)) target.field.detachIcon();
                    break;
                }

                case 'frame': {
                    const { formId, fieldId, fieldFrameId } = target;

                    void sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.INLINE_DROPDOWN_CLOSED,
                            payload: {
                                refocus: options.refocus ?? false,
                                fieldFrameId,
                                formId,
                                fieldId,
                            },
                        })
                    );

                    break;
                }
            }

            anchor.current = null;
        },

        backdropExclude: () => {
            if (!anchor?.current || anchor.current?.type !== 'field') return [];

            const rootNode = anchor.current.field.element.getRootNode();
            const host = isShadowRoot(rootNode) ? rootNode.host : null;

            return [anchor.current.field.icon?.element, anchor.current.field.element, host].filter(truthy);
        },

        position: (root: HTMLElement) => {
            const target = anchor.current;

            if (!target || target.type === 'frame') return { top: 0, left: 0 };

            const { element } = target.field;
            const boxElement = target.field.getAnchor().element;
            const boxed = boxElement !== element;
            const bodyTop = root.getBoundingClientRect().top;

            const styles = createStyleParser(boxElement);
            const computedHeight = getComputedHeight(styles, boxed ? 'inner' : 'outer');
            const { value: height, offset: offsetBox } = computedHeight;
            const { left: boxLeft, top, width } = boxElement.getBoundingClientRect();

            return {
                top: top - bodyTop + offsetBox.bottom + offsetBox.top + height,
                left: boxLeft + width - DROPDOWN_WIDTH,
            };
        },
        dimensions: () => ({ width: DROPDOWN_WIDTH, height: DROPDOWN_MIN_HEIGHT }),
    });

    /* if the dropdown is opened while the field is being animated
     * we must update its position until the position stabilizes */
    const updatePosition = () =>
        animatePositionChange({
            onAnimate: noop,
            get: () => iframe.getPosition(),
            set: () => iframe.updatePosition(),
        });

    /** Depending on the autofill action type, origin should be adapted.
     * In the case of CC autofill, we apply loose domain checking to support
     * cross-frame autofilling on different subdomain for the same tld.*/
    const resolveOrigin = (request: DropdownRequest, url: ParsedUrl): MaybeNull<string> => {
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
    const processDropdownRequest = withContext<(request: DropdownRequest) => Promise<Maybe<DropdownActions>>>(
        async (ctx, request) => {
            if (!ctx) return;

            const { action, autofocused } = request;
            const field = anchor.current?.type === 'field' ? anchor.current.field : null;

            const url = ctx.getExtensionContext()?.url;
            const origin = url ? resolveOrigin(request, url) : null;
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
                    if (autofocused && field?.autofilled) return;
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
                    return sendMessage.on(
                        contentScriptMessage({ type: WorkerMessageType.AUTOSUGGEST_PASSWORD }),
                        (res) => {
                            if (res.type === 'error') throw new Error(res.error);
                            return { action, origin, frameId, config: res.config, copy: res.copy, policy: res.policy };
                        }
                    );
                }
            }
        }
    );

    /* As we are recyling the dropdown iframe sub-app instead of
     * re-injecting for each field - opening the dropdown involves
     * passing the actual field handle to attach it to
     * Dropdown opening may be automatically triggered on initial
     * page load with a positive detection : ensure the iframe is
     * in a ready state in order to send out the dropdown action */
    const open = async (request: DropdownRequest): Promise<void> => {
        return iframe
            .ensureReady()
            .then(async () => {
                anchor.current =
                    request.type === 'field'
                        ? { type: 'field', field: request.field }
                        : {
                              type: 'frame',
                              frameId: request.frameId,
                              fieldFrameId: request.fieldFrameId,
                              frame: request.frame,
                              fieldId: request.fieldId,
                              formId: request.formId,
                          };

                const payload = await processDropdownRequest(request);

                if (!payload) {
                    anchor.current = null;
                    return;
                }

                iframe.sendPortMessage({
                    type: IFramePortMessageType.DROPDOWN_ACTION,
                    payload,
                });

                switch (request.type) {
                    case 'field':
                        const { field } = request;
                        const scrollParent = getScrollParent(field.element);
                        iframe.open(request.action, scrollParent);
                        updatePosition();
                        break;

                    case 'frame':
                        iframe.open(request.action);
                        iframe.setPosition(request.coords);
                        break;
                }
            })
            .catch(noop);
    };

    /** Only used when dropdown UI has input elements that may lose focus
     * due to page code. This can happen if blur/focus management is too
     * strict (eg: ticketmaster.com) where the dropdown can never get a
     * full focus. In this case, blur the anchor field and force the active
     * element to blur to ensure we're in an "unfocused state". */
    iframe.registerMessageHandler(IFramePortMessageType.DROPDOWN_FOCUS_CHECK, () => {
        const refocus = () => {
            const { activeElement } = document;
            if (activeElement && isHTMLElement(activeElement)) activeElement.blur();
            iframe.sendPortMessage({ type: IFramePortMessageType.DROPDOWN_FOCUS });
        };

        if (document.activeElement !== popover.root.customElement) {
            switch (anchor.current?.type) {
                case 'field':
                    anchor.current.field.element.blur();
                    setTimeout(refocus, 50);
                    break;
                case 'frame':
                    refocus();
                    break;
            }
        }
    });

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to. */
    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_LOGIN,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (!target || target.type === 'frame') return;

            const form = target.field.getFormHandle();
            if (!form) return;

            await ctx?.service.autofill.autofillLogin(form, payload);
            target.field.focus({ preventAction: true });
        }),
        { userAction: true }
    );

    /* For a password auto-suggestion - the password will have
     * been generated in the injected iframe and passed in clear
     * text through the secure extension port channel */
    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_GENERATED_PW,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (!target || target.type === 'frame') return;

            const form = target.field.getFormHandle();
            if (!form) return;

            const prompt = ctx?.getSettings().autosave.passwordSuggest;
            await ctx?.service.autofill.autofillPassword(form, payload.password);
            target.field.focus({ preventAction: true });

            form.tracker
                ?.processForm({ submit: false, partial: true })
                .then((res) => res && prompt && ctx.service.autosave.prompt(res))
                .catch(noop);
        }),
        { userAction: true }
    );

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_EMAIL,
        async ({ payload }) => {
            const target = anchor.current;
            if (!target || target.type === 'frame') return;

            await target.field.autofill(payload.email);
            target.field.focus({ preventAction: true });
            void target.field.getFormHandle()?.tracker?.processForm({ submit: false, partial: true });
        },
        { userAction: true }
    );

    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_IDENTITY,
        withContext(async (ctx, { payload }) => {
            const target = anchor.current;
            if (!target || target.type === 'frame') return;

            await ctx?.service.autofill.autofillIdentity(target.field, payload);
            target.field.focus({ preventAction: true });
        }),
        { userAction: true }
    );

    listeners.addListener(window, 'popstate', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'hashchange', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'beforeunload', () => iframe.close({ discard: false }));

    const dropdown: InjectedDropdown = {
        close: pipe(iframe.close, () => dropdown),
        destroy: iframe.destroy,
        getCurrentAnchor: () => anchor.current,
        getState: () => iframe.state,
        init: pipe(iframe.init, () => dropdown),
        open: pipe(open, () => dropdown),
        sendMessage: iframe.sendPortMessage,
    };

    return dropdown;
};
