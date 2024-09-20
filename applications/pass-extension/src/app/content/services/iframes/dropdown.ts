import { DROPDOWN_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_WIDTH, MIN_DROPDOWN_HEIGHT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import { createIFrameApp } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-app';
import type {
    DropdownActions,
    DropdownRequest,
    FieldHandle,
    InjectedDropdown,
} from 'proton-pass-extension/app/content/types';
import { DropdownAction, IFramePortMessageType } from 'proton-pass-extension/app/content/types';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import { type Maybe, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { createStyleCompute, getComputedHeight } from '@proton/pass/utils/dom/computed-styles';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';
import noop from '@proton/utils/noop';

type DropdownFieldRef = { current: MaybeNull<FieldHandle> };
type DropdownOptions = { root: ProtonPassRoot; onDestroy: () => void };

export const createDropdown = ({ root, onDestroy }: DropdownOptions): InjectedDropdown => {
    const fieldRef: DropdownFieldRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createIFrameApp<DropdownAction>({
        animation: 'fadein',
        backdropClose: true,
        id: 'dropdown',
        root,
        src: DROPDOWN_IFRAME_SRC,
        onError: onDestroy,
        onClose: (_, options) => {
            if (options.refocus) fieldRef.current?.focus();
            else if (fieldRef.current?.element !== document.activeElement) fieldRef.current?.detachIcon();
        },
        backdropExclude: () => [fieldRef.current?.icon?.element, fieldRef.current?.element].filter(truthy),
        position: (iframeRoot: HTMLElement) => {
            const field = fieldRef.current;
            if (!field) return { top: 0, left: 0 };

            const { boxElement, element } = field;
            const boxed = boxElement !== element;

            const bodyTop = iframeRoot.getBoundingClientRect().top;

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
        dimensions: () => ({ width: DROPDOWN_WIDTH, height: MIN_DROPDOWN_HEIGHT }),
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
            const { url } = ctx.getExtensionContext();
            const domain = url?.subdomain ?? url?.domain ?? '';

            switch (action) {
                case DropdownAction.AUTOFILL_IDENTITY: {
                    if (!authorized) return { action, domain: '' };
                    if (autofocused && field.autofilled && !field.icon) return;
                    if (autofocused && !(await ctx.service.autofill.getIdentitiesCount())) return;
                    return { action, domain };
                }

                case DropdownAction.AUTOFILL_LOGIN: {
                    if (!authorized) return { action, domain: '' };
                    if (autofocused && !(await ctx.service.autofill.getCredentialsCount())) return;
                    return { action, domain };
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
                            return { action, domain, config: res.config, copy: res.copy };
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
     * page load with a positive ifion : ensure the iframe is
     * in a ready state in order to send out the dropdown action */
    const open = (request: DropdownRequest): Promise<void> =>
        iframe
            .ensureReady()
            .then(async () => {
                fieldRef.current = request.field;
                const payload = await processDropdownRequest(request);

                if (payload) {
                    iframe.sendPortMessage({ type: IFramePortMessageType.DROPDOWN_ACTION, payload });
                    iframe.open(request.action, getScrollParent(request.field.element));
                    updatePosition();
                }
            })
            .catch(noop);

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to. */
    iframe.registerMessageHandler(
        IFramePortMessageType.DROPDOWN_AUTOFILL_LOGIN,
        withContext((ctx, { payload }) => {
            const form = fieldRef.current?.getFormHandle();
            if (!form) return;

            ctx?.service.autofill.autofillLogin(form, payload);
            fieldRef.current?.focus({ preventAction: true });
        })
    );

    /* For a password auto-suggestion - the password will have
     * been generated in the injected iframe and passed in clear
     * text through the secure extension port channel */
    iframe.registerMessageHandler(
        IFramePortMessageType.DROPDOWN_AUTOFILL_GENERATED_PW,
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
        })
    );

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(IFramePortMessageType.DROPDOWN_AUTOFILL_EMAIL, ({ payload }) => {
        fieldRef.current?.autofill(payload.email);
        fieldRef.current?.focus({ preventAction: true });
        void fieldRef.current?.getFormHandle()?.tracker?.sync({ submit: false, partial: true });
    });

    iframe.registerMessageHandler(
        IFramePortMessageType.DROPDOWN_AUTOFILL_IDENTITY,
        withContext((ctx, { payload }) => {
            const field = fieldRef.current;
            if (field) {
                ctx?.service.autofill.autofillIdentity(field, payload);
                fieldRef.current?.focus({ preventAction: true });
            }
        })
    );

    const destroy = () => {
        fieldRef.current = null;
        listeners.removeAll();
        iframe.destroy();
        onDestroy();
    };

    listeners.addListener(window, 'popstate', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'hashchange', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'unload', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'beforeunload', () => iframe.close({ discard: false }));

    const dropdown: InjectedDropdown = {
        close: pipe(iframe.close, () => dropdown),
        destroy,
        getCurrentField: () => fieldRef.current,
        getState: () => iframe.state,
        init: pipe(iframe.init, () => dropdown),
        open: pipe(open, () => dropdown),
        sendMessage: iframe.sendPortMessage,
    };

    return dropdown;
};
