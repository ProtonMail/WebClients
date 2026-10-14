import { clearDetectionCache } from '@protontech/autofill';
import type { FieldType } from '@protontech/autofill/types';
import { FormType } from '@protontech/autofill/types';
import { waitFor } from '@testing-library/react';
import type { Runtime } from 'webextension-polyfill';

import '@proton/components/testing/mockMatchMedia';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull } from '@proton/pass/types';
import type { ClientInitResult } from '@proton/pass/types/worker/runtime';
import { AppStatus } from '@proton/pass/types/worker/state';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { mockLayout } from '@proton/pass/utils/tests/layout';

import browser from '../__mocks__/webextension-polyfill';
import { CSContext } from '../app/content/context/context';
import { createContentScriptClient } from '../app/content/services/client/client';
import type { ClientController } from '../app/content/services/client/client.controller';
import { createClientController } from '../app/content/services/client/client.controller';
import type { FieldElement } from '../app/content/services/form/field';
import type { FormHandle } from '../app/content/services/form/form';
import { ProtonPassControl } from '../app/content/services/inline/custom-elements/ProtonPassControl';
import { ProtonPassRoot } from '../app/content/services/inline/custom-elements/ProtonPassRoot';
import { mockHandlers } from '../app/worker/__mocks__/channel.handlers';
import { resolveEndpointContext } from '../lib/utils/endpoint';
import { WorkerMessageType } from '../types/messages';

const createPort = (name: string) =>
    ({
        name,
        onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
        onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() },
        postMessage: jest.fn(),
        disconnect: jest.fn(),
    }) as unknown as Runtime.Port;

/** Worker replies the content-script needs to boot, owned by worker
 * services other than autofill (activation, injection). */
const registerBootHandlers = () => {
    mockHandlers.set(WorkerMessageType.REGISTER_ELEMENTS, () => {
        const hash = uniqueId(4);
        customElements.define(ProtonPassRoot.getTagName(hash), class extends ProtonPassRoot {});
        customElements.define(ProtonPassControl.getTagName(hash), class extends ProtonPassControl {});
        return { hash, scriptFallback: false };
    });

    mockHandlers.set(WorkerMessageType.ENDPOINT_INIT, (_: unknown, sender: Runtime.MessageSender) =>
        resolveEndpointContext(sender.tab, sender.frameId ?? 0)
    );

    mockHandlers.set(WorkerMessageType.CLIENT_INIT, (): ClientInitResult => ({
        state: { authorized: true, booted: true, localID: 0, status: AppStatus.READY, UID: 'uid' },
        settings: getInitialSettings(),
        features: {},
        connectivity: ConnectivityStatus.ONLINE,
        session: {},
    }));

    (browser.runtime as any).id = 'test-extension';
    (browser.runtime as any).connect = jest.fn((_id: string, { name }: { name: string }) => createPort(name));
};

/** jsdom lacks constructable stylesheets, used by the inline UI shadow roots */
const mockConstructableStylesheets = () => {
    CSSStyleSheet.prototype.replaceSync ??= function () {};
    if (!('adoptedStyleSheets' in ShadowRoot.prototype)) {
        const sheets = new WeakMap<ShadowRoot, CSSStyleSheet[]>();
        Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
            configurable: true,
            get(this: ShadowRoot) {
                if (!sheets.has(this)) sheets.set(this, []);
                return sheets.get(this);
            },
        });
    }
};

/** jsdom has no idle callbacks (same fallback as the safari shim) */
const mockIdleCallback = () => {
    window.requestIdleCallback ??= (cb) =>
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1) as unknown as number;
    window.cancelIdleCallback ??= (id) => clearTimeout(id);
};

/** jsdom's CSS parser rejects modern syntax in recorded stylesheets and
 * logs each failure. The parsable rules still apply, so only mute that. */
const withoutCssParseErrors = (fn: () => void) => {
    const consoleError = console.error;
    const spy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        const [error] = args as [{ message?: string }];
        if (error?.message === 'Could not parse CSS stylesheet') return;
        consoleError(...args);
    });

    try {
        fn();
    } finally {
        spy.mockRestore();
    }
};

/** Loads `html` as the document of a visible tab */
export const loadPage = (html: string) => {
    mockLayout();
    mockConstructableStylesheets();
    mockIdleCallback();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    // nosemgrep: insecure-innerhtml -- jsdom only, `html` is a recorded fixture page with scripts stripped
    withoutCssParseErrors(() => (document.documentElement.innerHTML = html));
};

let controller: MaybeNull<ClientController> = null;

export const startContentScript = async () => {
    registerBootHandlers();

    controller = createClientController({
        mainFrame: true,
        scriptId: uniqueId(16),
        clientFactory: createContentScriptClient,
    });

    await controller.init();
    return controller;
};

/** Registered on import, like testing-library's auto cleanup: every
 * journey starts from a blank page without a live content-script */
afterEach(() => {
    controller?.destroy('test teardown');
    controller = null;
    mockHandlers.clear();
    clearDetectionCache();
    document.documentElement.innerHTML = '';
});

const getContentScript = () => {
    const ctx = CSContext.get();
    if (!ctx) throw new Error('Content-script context is not initialized');
    return ctx;
};

const waitForForm = (formType: FormType) =>
    waitFor(() => {
        const form = getContentScript()
            .service.formManager.getForms()
            .find((handle) => handle.formType === formType);
        if (!form) throw new Error(`No ${formType} form detected yet`);
        return form;
    });

export const waitForLoginForm = () => waitForForm(FormType.LOGIN);

export const getField = <T extends FieldType>(form: FormHandle, fieldType: T) => {
    const [field] = form.getFieldsFor(fieldType);
    if (!field) throw new Error(`No ${fieldType} field in the ${form.formType} form`);
    return field;
};

const INPUT_EVENTS = ['input', 'change'];
const inputEventKey = (element: FieldElement, type: string) => `${element.name || element.id}:${type}`;

/** Records `input` / `change` events as `<name>:<type>`, the
 * events pages listen to when validating autofilled values */
export const recordInputEvents = (...elements: FieldElement[]) => {
    const events: string[] = [];
    elements.forEach((element) =>
        INPUT_EVENTS.forEach((type) => element.addEventListener(type, () => events.push(inputEventKey(element, type))))
    );
    return events;
};

/** Events a user typing into every element would have fired */
export const inputEventsOf = (...elements: FieldElement[]) =>
    elements.flatMap((element) => INPUT_EVENTS.map((type) => inputEventKey(element, type)));
