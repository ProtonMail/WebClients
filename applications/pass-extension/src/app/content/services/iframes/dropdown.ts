import { DROPDOWN_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_MIN_HEIGHT, DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { createIFrameApp } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-app';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import type {
    DropdownActions,
    DropdownRequest,
    FieldHandle,
    InjectedDropdown,
} from 'proton-pass-extension/app/content/types';
import { DropdownAction, IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isVisible } from '@proton/pass/fathom';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import { type Maybe, type MaybeNull } from '@proton/pass/types';
import { createStyleCompute, getComputedHeight } from '@proton/pass/utils/dom/computed-styles';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { resolveDomain } from '@proton/pass/utils/url/utils';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';
import noop from '@proton/utils/noop';

type DropdownFieldRef = { current: MaybeNull<FieldHandle> };

type DropdownOptions = { popover: PopoverController; onDestroy: () => void };

export const createDropdown = ({ popover, onDestroy }: DropdownOptions): InjectedDropdown => {
    const fieldRef: DropdownFieldRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createIFrameApp<DropdownAction>({
        animation: 'fadein',
        backdropClose: true,
        id: 'dropdown',
        popover,
        src: DROPDOWN_IFRAME_SRC,
        onDestroy: () => {
            fieldRef.current = null;
            listeners.removeAll();
            onDestroy();
        },
        onError: () => iframe.destroy(),
        onClose: (_, options) => {
            const field = fieldRef.current;
            if (options.refocus) field?.focus();
            else if (!isActiveElement(fieldRef.current?.element)) fieldRef.current?.detachIcon();
        },
        backdropExclude: () => [fieldRef.current?.icon?.element, fieldRef.current?.element].filter(truthy),
        position: (root: HTMLElement) => {
            const field = fieldRef.current;
            if (!field) return { top: 0, left: 0 };

            const { boxElement, element } = field;
            const boxed = boxElement !== element;
            const bodyTop = root.getBoundingClientRect().top;

            const { value: height, offset: offsetBox } = getComputedHeight(createStyleCompute(boxElement), {
                node: boxElement,
                mode: boxed ? 'inner' : 'outer',
            });

            const { left: boxLeft, top, width } = boxElement.getBoundingClientRect();

            return {
                top: top - bodyTop + offsetBox.top + height,
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

    /** Processes a dropdown request to create a usable payload for the injected dropdown.
     * Returns undefined to cancel if the request is invalid. For login/identity autofill
     * triggered by a focus event, ensures a valid item count exists before proceeding. */
    const processDropdownRequest = withContext<(request: DropdownRequest) => Promise<Maybe<DropdownActions>>>(
        async (ctx, { action, autofocused, field }) => {
            if (!ctx) return;

            const { authorized } = ctx.getState();
            const url = ctx.getExtensionContext()?.url;
            const domain = url ? resolveDomain(url) : null;

            if (!domain) return;

            switch (action) {
                case DropdownAction.AUTOFILL_IDENTITY: {
                    if (!authorized) return { action, domain: '' };
                    if (autofocused && field.autofilled && !field.icon) return;
                    if (autofocused && !(await ctx.service.autofill.getIdentitiesCount())) return;
                    return { action, domain };
                }

                case DropdownAction.AUTOFILL_LOGIN: {
                    if (!authorized) return { action, domain: '', startsWith: '' };
                    if (autofocused && !(await ctx.service.autofill.getCredentialsCount())) return;
                    return { action, domain, startsWith: '' };
                }
                case DropdownAction.AUTOSUGGEST_ALIAS: {
                    if (!url?.displayName) throw new Error();
                    return { action, domain, prefix: deriveAliasPrefix(url.displayName) };
                }
                case DropdownAction.AUTOSUGGEST_PASSWORD: {
                    return sendMessage.on(
                        contentScriptMessage({ type: WorkerMessageType.AUTOSUGGEST_PASSWORD }),
                        (res) => {
                            if (res.type === 'error') throw new Error(res.error);
                            return { action, domain, config: res.config, copy: res.copy, policy: res.policy };
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
        const { field } = request;
        const anchor = request.field.element;

        /** At the cost of bypassing the visibility cache, perform a fresh visibility
         * check before opening the dropdown to prevent certain click-jacking attacks */
        if (!isVisible(anchor, { opacity: true, skipCache: true })) return;

        return iframe
            .ensureReady()
            .then(async () => {
                fieldRef.current = field;
                const payload = await processDropdownRequest(request);

                if (payload) {
                    iframe.sendPortMessage({ type: IFramePortMessageType.DROPDOWN_ACTION, payload });
                    iframe.open(request.action, getScrollParent(anchor));
                    updatePosition();
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
        if (document.activeElement !== popover.root.customElement) {
            fieldRef.current?.element.blur();

            setTimeout(() => {
                const { activeElement } = document;
                if (activeElement && isHTMLElement(activeElement)) activeElement.blur();
                iframe.sendPortMessage({ type: IFramePortMessageType.DROPDOWN_FOCUS });
            }, 50);
        }
    });

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to. */
    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_LOGIN,
        withContext((ctx, { payload }) => {
            const form = fieldRef.current?.getFormHandle();
            if (!form) return;

            ctx?.service.autofill.autofillLogin(form, payload);
            fieldRef.current?.focus({ preventAction: true });
        }),
        { userAction: true }
    );

    /* For a password auto-suggestion - the password will have
     * been generated in the injected iframe and passed in clear
     * text through the secure extension port channel */
    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_GENERATED_PW,
        withContext((ctx, { payload }) => {
            const form = fieldRef.current?.getFormHandle();
            const prompt = ctx?.getSettings().autosave.passwordSuggest;

            if (!form) return;

            ctx?.service.autofill.autofillPassword(form, payload.password);
            fieldRef.current?.focus({ preventAction: true });

            form.tracker
                ?.sync({ submit: false, partial: true })
                .then((res) => res && prompt && ctx.service.autosave.promptAutoSave(res))
                .catch(noop);
        }),
        { userAction: true }
    );

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_EMAIL,
        ({ payload }) => {
            fieldRef.current?.autofill(payload.email);
            fieldRef.current?.focus({ preventAction: true });
            void fieldRef.current?.getFormHandle()?.tracker?.sync({ submit: false, partial: true });
        },
        { userAction: true }
    );

    iframe.registerMessageHandler(
        IFramePortMessageType.AUTOFILL_IDENTITY,
        withContext((ctx, { payload }) => {
            const field = fieldRef.current;
            if (field) {
                ctx?.service.autofill.autofillIdentity(field, payload);
                fieldRef.current?.focus({ preventAction: true });
            }
        }),
        { userAction: true }
    );

    listeners.addListener(window, 'popstate', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'hashchange', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'beforeunload', () => iframe.close({ discard: false }));

    const dropdown: InjectedDropdown = {
        close: pipe(iframe.close, () => dropdown),
        destroy: iframe.destroy,
        getCurrentField: () => fieldRef.current,
        getState: () => iframe.state,
        init: pipe(iframe.init, () => dropdown),
        open: pipe(open, () => dropdown),
        sendMessage: iframe.sendPortMessage,
    };

    return dropdown;
};
