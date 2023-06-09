import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { MaybeNull } from '@proton/pass/types';
import { FormField, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { first } from '@proton/pass/utils/array';
import { createStyleCompute, getComputedHeight } from '@proton/pass/utils/dom';
import { pipe, truthy, waitUntil } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';

import { deriveAliasPrefix } from '../../../shared/items/alias';
import { DROPDOWN_IFRAME_SRC, DROPDOWN_WIDTH, MIN_DROPDOWN_HEIGHT } from '../../constants';
import { withContext } from '../../context/context';
import { createIFrameApp } from '../../injections/iframe/create-iframe-app';
import type { DropdownSetActionPayload, FieldHandle, InjectedDropdown, OpenDropdownOptions } from '../../types';
import { DropdownAction } from '../../types';
import { IFrameMessageType } from '../../types/iframe';

type DropdownFieldRef = { current: MaybeNull<FieldHandle> };

export const createDropdown = (): InjectedDropdown => {
    const fieldRef: DropdownFieldRef = { current: null };
    const listeners = createListenerStore();

    const iframe = createIFrameApp({
        id: 'dropdown',
        src: DROPDOWN_IFRAME_SRC,
        animation: 'fadein',
        backdropClose: true,
        backdropExclude: () => [fieldRef.current?.icon?.element, fieldRef.current?.element].filter(truthy),
        position: (iframeRoot: HTMLElement) => {
            const field = fieldRef.current;
            if (!field) return { top: 0, left: 0 };

            const bodyTop = iframeRoot.getBoundingClientRect().top;
            const st = createStyleCompute(field.boxElement);

            const boxed = field.boxElement !== field.element;
            const {
                value: height,
                offset: { top: offsetTop },
            } = getComputedHeight(st, { node: field.boxElement, mode: boxed ? 'inner' : 'outer' });

            const { left, top, width } = field.boxElement.getBoundingClientRect();

            return {
                top: top - bodyTop + offsetTop + height,
                left: left + width - DROPDOWN_WIDTH,
                zIndex: field.zIndex,
            };
        },
        dimensions: () => ({ width: DROPDOWN_WIDTH, height: MIN_DROPDOWN_HEIGHT }),
    });

    /* if the dropdown is opened while the field is being animated
     * we must update its position until the position stabilizes */
    const updatePosition = () => {
        let { top, left, right } = iframe.getPosition();

        const check = () =>
            requestAnimationFrame(() => {
                const { top: nTop, left: nLeft, right: nRight } = iframe.getPosition();
                if (nTop !== top || nLeft !== left || nRight !== right) {
                    iframe.updatePosition();
                    top = nTop;
                    left = nLeft;
                    right = nRight;
                    check();
                }
            });

        check();
    };

    /* As we are recyling the dropdown iframe sub-app instead of
     * re-injecting for each field - opening the dropdown involves
     * passing the actual field handle to attach it to
     * Dropdown opening may be automatically triggered on initial
     * page load with a positive ifion : ensure the iframe is
     * in a ready state in order to send out the dropdown action */
    const open = withContext<(options: OpenDropdownOptions) => Promise<void>>(
        async ({ service: { autofill }, getState, getExtensionContext }, { field, action, autofocused }) => {
            await waitUntil(() => iframe.state.ready, 50);
            fieldRef.current = field;

            const { loggedIn } = getState();

            const payload = await (async (): Promise<DropdownSetActionPayload> => {
                switch (action) {
                    case DropdownAction.AUTOFILL: {
                        if (!loggedIn) return { action, items: [], needsUpgrade: false };
                        const { items, needsUpgrade } = await autofill.queryItems();

                        return {
                            action,
                            items,
                            needsUpgrade,
                        };
                    }
                    case DropdownAction.AUTOSUGGEST_ALIAS: {
                        const { domain, subdomain, displayName } = getExtensionContext().url;
                        return {
                            action,
                            domain: subdomain ?? domain!,
                            prefix: deriveAliasPrefix(displayName!),
                        };
                    }
                    case DropdownAction.AUTOSUGGEST_PASSWORD: {
                        return { action };
                    }
                }
            })();

            /* If the opening action is coming from a focus event
             * for an autofill action and the we have no login
             * items that match the current domain, avoid auto-opening
             * the dropdown */
            const blockAutofocus =
                autofocused && payload.action === DropdownAction.AUTOFILL && payload.items.length === 0;

            if (!blockAutofocus) {
                iframe.sendPortMessage({ type: IFrameMessageType.DROPDOWN_ACTION, payload });
                const scrollParent = getScrollParent(field.element);

                if (!iframe.state.visible) {
                    void sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.TELEMETRY_EVENT,
                            payload: {
                                event: createTelemetryEvent(
                                    TelemetryEventName.AutofillDisplay,
                                    {},
                                    { location: 'source' }
                                ),
                            },
                        })
                    );
                }

                iframe.open(scrollParent);
                updatePosition();
            }
        }
    );

    /* On a login autofill request - resolve the credentials via
     * worker communication and autofill the parent form of the
     * field the current dropdown is attached to.
     * FIXME: autofill logic should be moved to the AutofillService */
    iframe.registerMessageHandler(IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN, (message) => {
        const { shareId, itemId } = message.payload.item;

        void sendMessage.onSuccess(
            contentScriptMessage({
                type: WorkerMessageType.AUTOFILL_SELECT,
                payload: { shareId, itemId },
            }),
            ({ username, password }) => {
                const form = fieldRef.current?.getFormHandle();

                void sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.TELEMETRY_EVENT,
                        payload: {
                            event: createTelemetryEvent(
                                TelemetryEventName.AutofillTriggered,
                                {},
                                { location: 'source' }
                            ),
                        },
                    })
                );

                first(form?.getFieldsFor(FormField.USERNAME) ?? [])?.autofill(username);
                first(form?.getFieldsFor(FormField.EMAIL) ?? [])?.autofill(username);
                form?.getFieldsFor(FormField.PASSWORD_CURRENT).forEach((field) => field.autofill(password));

                iframe.close();
                fieldRef.current?.focus({ preventDefault: true });
            }
        );
    });

    /* For a password auto-suggestion - the password will have
     * been generated in the injected iframe and passed in clear
     * text through the secure extension port channel */
    iframe.registerMessageHandler(IFrameMessageType.DROPDOWN_AUTOSUGGEST_PASSWORD, (message) => {
        const { password } = message.payload;
        const form = fieldRef.current?.getFormHandle();

        form?.getFieldsFor(FormField.PASSWORD_NEW).forEach((field) => field.autofill(password));

        iframe.close();
        fieldRef.current?.focus({ preventDefault: true });
    });

    /* When suggesting an alias on a register form, the alias will
     * only be created upon user action - this avoids creating
     * aliases everytime the injected iframe dropdown is opened */
    iframe.registerMessageHandler(IFrameMessageType.DROPDOWN_AUTOSUGGEST_ALIAS, ({ payload }) => {
        const { aliasEmail } = payload;
        fieldRef.current?.autofill(aliasEmail);
        iframe.close();
        fieldRef.current?.focus({ preventDefault: true });
    });

    const destroy = () => {
        fieldRef.current = null;
        listeners.removeAll();
        iframe.destroy();
    };

    listeners.addListener(window, 'popstate', () => iframe.close({ userInitiated: false }));
    listeners.addListener(window, 'hashchange', () => iframe.close({ userInitiated: false }));
    listeners.addListener(window, 'unload', () => iframe.close({ userInitiated: false }));
    listeners.addListener(window, 'beforeunload', () => iframe.close({ userInitiated: false }));

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
