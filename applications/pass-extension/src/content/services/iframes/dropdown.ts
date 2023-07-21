import { type MaybeNull } from '@proton/pass/types';
import { animatePositionChange, createStyleCompute, getComputedHeight } from '@proton/pass/utils/dom';
import { pipe, truthy, waitUntil } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';

import { deriveAliasPrefix } from '../../../shared/items/alias';
import { DROPDOWN_IFRAME_SRC, DROPDOWN_WIDTH, MIN_DROPDOWN_HEIGHT } from '../../constants';
import { withContext } from '../../context/context';
import { createIFrameApp } from '../../injections/iframe/create-iframe-app';
import type { DropdownActions, DropdownOpenOptions, FieldHandle, InjectedDropdown } from '../../types';
import { DropdownAction } from '../../types';
import { IFrameMessageType } from '../../types/iframe';

type DropdownFieldRef = { current: MaybeNull<FieldHandle> };

export const createDropdown = (): InjectedDropdown => {
    const fieldRef: DropdownFieldRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createIFrameApp<DropdownAction>({
        id: 'dropdown',
        src: DROPDOWN_IFRAME_SRC,
        animation: 'fadein',
        backdropClose: true,
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
                zIndex: zIndex,
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

    /* As we are recyling the dropdown iframe sub-app instead of
     * re-injecting for each field - opening the dropdown involves
     * passing the actual field handle to attach it to
     * Dropdown opening may be automatically triggered on initial
     * page load with a positive ifion : ensure the iframe is
     * in a ready state in order to send out the dropdown action */
    const open = withContext<(options: DropdownOpenOptions) => Promise<void>>(
        async ({ service: { autofill }, getState, getExtensionContext }, { field, action, autofocused }) => {
            await waitUntil(() => iframe.state.ready, 50);
            fieldRef.current = field;

            const { loggedIn } = getState();

            const payload = await (async (): Promise<DropdownActions> => {
                switch (action) {
                    case DropdownAction.AUTOFILL: {
                        if (!loggedIn) return { action, items: [], needsUpgrade: false };
                        const { items, needsUpgrade } = await autofill.getAutofillCandidates();
                        return { action, items, needsUpgrade };
                    }
                    case DropdownAction.AUTOSUGGEST_ALIAS: {
                        const { domain, subdomain, displayName } = getExtensionContext().url;
                        return { action, domain: subdomain ?? domain!, prefix: deriveAliasPrefix(displayName!) };
                    }
                    case DropdownAction.AUTOSUGGEST_PASSWORD: {
                        return { action };
                    }
                }
            })();

            /* If the opening action is coming from a focus event for an autofill action and the we
             * have no login items that match the current domain, avoid auto-opening  the dropdown */
            if (autofocused && payload.action === DropdownAction.AUTOFILL && payload.items.length === 0) return;

            iframe.sendPortMessage({ type: IFrameMessageType.DROPDOWN_ACTION, payload });
            const scrollParent = getScrollParent(field.element);
            iframe.open(action, scrollParent);
            updatePosition();
        }
    );

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to. */
    iframe.registerMessageHandler(
        IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
        withContext(({ service }, { payload }) => {
            const form = fieldRef.current?.getFormHandle();
            if (!form) return;

            service.autofill.autofillLogin(form, payload);
            iframe.close({ refocus: false });
            fieldRef.current?.focus({ preventAction: true });
        })
    );

    /* For a password auto-suggestion - the password will have
     * been generated in the injected iframe and passed in clear
     * text through the secure extension port channel */
    iframe.registerMessageHandler(
        IFrameMessageType.DROPDOWN_AUTOFILL_GENERATED_PW,
        withContext(({ service }, { payload }) => {
            const form = fieldRef.current?.getFormHandle();
            if (!form) return;

            iframe.close();
            service.autofill.autofillGeneratedPassword(form, payload.password);
            fieldRef.current?.focus({ preventAction: true });
        })
    );

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(IFrameMessageType.DROPDOWN_AUTOFILL_EMAIL, ({ payload }) => {
        iframe.close();
        fieldRef.current?.autofill(payload.email);
        fieldRef.current?.focus({ preventAction: true });
    });

    const destroy = () => {
        fieldRef.current = null;
        listeners.removeAll();
        iframe.destroy();
    };

    listeners.addListener(window, 'popstate', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'hashchange', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'unload', () => iframe.close({ discard: false }));
    listeners.addListener(window, 'beforeunload', () => iframe.close({ discard: false }));

    const dropdown: InjectedDropdown = {
        getState: () => iframe.state,
        getCurrentField: () => fieldRef.current,
        reset: pipe(iframe.reset, () => dropdown),
        close: pipe(iframe.close, () => dropdown),
        init: pipe(iframe.init, () => dropdown),
        open: pipe(open, () => dropdown),
        destroy,
    };

    return dropdown;
};
