import { createAutofillService } from 'proton-pass-extension/app/content/services/form/autofill';
import { createAutosaveService } from 'proton-pass-extension/app/content/services/form/autosave';
import { createDetectorService } from 'proton-pass-extension/app/content/services/form/detector';
import { createFormManager } from 'proton-pass-extension/app/content/services/form/manager';
import { createIFrameService } from 'proton-pass-extension/app/content/services/iframes/service';
import { createWebAuthNService } from 'proton-pass-extension/app/content/services/webauthn';
import { IGNORED_TAGS } from 'proton-pass-extension/app/content/utils/nodes';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { FormType } from '@proton/pass/fathom';
import { matchExtensionMessage } from '@proton/pass/lib/extension/message/utils';
import browser from '@proton/pass/lib/globals/browser';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

import { CSContext } from './context';
import type { CSContextState, ContentScriptContext } from './types';
import { hasPauseCriteria } from './utils';

export const createContentScriptContext = (options: {
    scriptId: string;
    mainFrame: boolean;
    elements: PassElementsConfig;
    destroy: (options: { reason: string }) => void;
}): ContentScriptContext => {
    const state: CSContextState = {
        authorized: false,
        booted: false,
        localID: undefined,
        ready: false,
        stale: false,
        status: AppStatus.IDLE,
        UID: undefined,
    };

    /** Add the custom elements to the ignored nodes to ignore
     * any mutation/transition events inside the form manager */
    IGNORED_TAGS.add(options.elements.control.toUpperCase());
    IGNORED_TAGS.add(options.elements.root.toUpperCase());

    const settings: ProxiedSettings = getInitialSettings();
    const featureFlags: FeatureFlagState = {};

    const context: ContentScriptContext = CSContext.set({
        elements: options.elements,
        mainFrame: options.mainFrame,
        scriptId: options.scriptId,

        service: {
            autofill: createAutofillService(),
            autosave: createAutosaveService(),
            detector: createDetectorService(),
            formManager: createFormManager({
                onDetection: (forms) => {
                    /* attach or detach dropdown based on the detection results */
                    const didDetect = forms.length > 0;
                    if (didDetect) context.service.iframe.attachDropdown(document.body);
                    else context.service.iframe.dropdown?.destroy();
                },
            }),
            iframe: createIFrameService(options.elements),
            webauthn: BUILD_TARGET !== 'safari' ? createWebAuthNService() : undefined,
        },

        destroy: options.destroy,
        getExtensionContext: () => ExtensionContext.read(),
        getFeatureFlags: () => featureFlags,
        getFeatures: () => {
            const disallowed = settings.disallowedDomains ?? {};
            const url = context.getExtensionContext()?.url;

            const { autofill, autosuggest, autosave, passkeys } = settings;
            const hasPause = hasPauseCriteria({ disallowedDomains: disallowed, url });

            return {
                /** autofill can only be active if user has `autofill.login` or `autofill.identity` */
                Autofill: (autofill.login || autofill.identity) && !hasPause.Autofill,
                Autofill2FA: autofill.twofa && !hasPause.Autofill2FA,
                AutosuggestPassword: autosuggest.password && !hasPause.Autosuggest,
                AutosuggestAlias: autosuggest.email && !hasPause.Autosuggest,
                Autosave: autosave.prompt && !hasPause.Autosave,
                Passkeys: (passkeys.create || passkeys.get) && !hasPause.Passkey,
            };
        },
        getSettings: () => settings,
        getState: () => state,
        setFeatureFlags: (update) => {
            (Object.keys(featureFlags) as PassFeature[]).forEach((key) => delete featureFlags[key]);
            return Object.assign(featureFlags, update);
        },
        setSettings: (update) => Object.assign(settings, update),
        setState: (update) => Object.assign(state, update),
    });

    browser.runtime.onMessage.addListener((message, _, sendResponse) => {
        if (matchExtensionMessage(message, { type: WorkerMessageType.AUTOFILL_CHECK_FORM, sender: 'background' })) {
            const hasLoginForm = context.service.formManager
                .getTrackedForms()
                .some((form) => form.formType === FormType.LOGIN);

            sendResponse({ hasLoginForm });
            return true;
        }

        /** Note: The type assertion is necessary because the OnMessageListener type
         * has constraints that don't properly handle conditional use of `sendResponse`.  */
        return undefined as any;
    });

    return context;
};
