import { DROPDOWN_IFRAME_SRC } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_WIDTH, MIN_DROPDOWN_HEIGHT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import { createIFrameApp } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-app';
import type {
    DropdownActions,
    DropdownOpenOptions,
    FieldHandle,
    InjectedDropdown,
} from 'proton-pass-extension/app/content/types';
import { DropdownAction, IFrameMessageType } from 'proton-pass-extension/app/content/types';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
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
        onClose: (_, options) => options?.refocus && fieldRef.current?.focus(),
        backdropExclude: () => [fieldRef.current?.icon?.element, fieldRef.current?.element].filter(truthy),
        position: (iframeRoot: HTMLElement) => {
            const field = fieldRef.current;
            if (!field) return { top: 0, left: 0 };

            const { boxElement, element, zIndex } = field;
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
                zIndex,
            };
        },
        dimensions: () => ({ width: DROPDOWN_WIDTH, height: MIN_DROPDOWN_HEIGHT }),
    });

    /* if the dropdown is opened while the field is being animated
     * we must update its position until the position stabilizes */
    const updatePosition = () =>
        animatePositionChange({
            get: () => iframe.getPosition(),
            set: () => iframe.updatePosition(),
        });

    const getPayloadForAction = withContext<(action: DropdownAction) => Promise<Maybe<DropdownActions>>>(
        async (ctx, action) => {
            if (!ctx) return;

            const { loggedIn } = ctx.getState();
            const { domain, subdomain, displayName } = ctx.getExtensionContext().url;
            const hostname = subdomain ?? domain ?? '';

            switch (action) {
                case DropdownAction.AUTOFILL: {
                    if (!loggedIn) return { action, hostname: '', items: [], needsUpgrade: false };
                    const { items, needsUpgrade } = ctx.service.autofill.getState() ?? {};
                    return { action, hostname, items: items ?? [], needsUpgrade: Boolean(needsUpgrade) };
                }
                case DropdownAction.AUTOSUGGEST_ALIAS: {
                    return { action, hostname, prefix: deriveAliasPrefix(displayName!) };
                }
                case DropdownAction.AUTOSUGGEST_PASSWORD: {
                    const config = await sendMessage.on(
                        contentScriptMessage({ type: WorkerMessageType.AUTOSUGGEST_PASSWORD_CONFIG }),
                        (res) => (res.type === 'success' ? res.config : DEFAULT_RANDOM_PW_OPTIONS)
                    );

                    return { action, config, hostname };
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
    const open = ({ field, action, autofocused }: DropdownOpenOptions): Promise<void> =>
        iframe
            .ensureReady()
            .then(async () => {
                fieldRef.current = field;
                const payload = await getPayloadForAction(action);

                if (payload) {
                    /* If the opening action is coming from a focus event for an autofill action and the we
                     * have no login items that match the current domain, avoid auto-opening  the dropdown */
                    if (autofocused && payload.action === DropdownAction.AUTOFILL && payload.items.length === 0) return;

                    iframe.sendPortMessage({ type: IFrameMessageType.DROPDOWN_ACTION, payload });
                    iframe.open(action, getScrollParent(field.element));
                    updatePosition();
                }
            })
            .catch(noop);

    const sync = async () => {
        const action = fieldRef.current?.action;
        if (action) {
            const payload = await getPayloadForAction(action);
            if (payload) iframe.sendPortMessage({ type: IFrameMessageType.DROPDOWN_ACTION, payload });
        }
    };

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to. */
    iframe.registerMessageHandler(
        IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
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
        IFrameMessageType.DROPDOWN_AUTOFILL_GENERATED_PW,
        withContext((ctx, { payload }) => {
            const form = fieldRef.current?.getFormHandle();
            if (!form) return;

            ctx?.service.autofill.autofillGeneratedPassword(form, payload.password);
            fieldRef.current?.focus({ preventAction: true });
            form.tracker?.submit();
        })
    );

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(IFrameMessageType.DROPDOWN_AUTOFILL_EMAIL, ({ payload }) => {
        fieldRef.current?.autofill(payload.email);
        fieldRef.current?.focus({ preventAction: true });
        fieldRef.current?.getFormHandle()?.tracker?.submit();
    });

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
        sync,
    };

    return dropdown;
};
