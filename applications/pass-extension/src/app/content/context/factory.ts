import type { ClientController } from 'proton-pass-extension/app/content/client.controller';
import { createAutofillService } from 'proton-pass-extension/app/content/services/autofill/autofill';
import { createAutosaveRelay } from 'proton-pass-extension/app/content/services/autosave/autosave.relay';
import { createAutosaveService } from 'proton-pass-extension/app/content/services/autosave/autosave.service';
import { createDetectorService } from 'proton-pass-extension/app/content/services/form/detector';
import { createFormManager } from 'proton-pass-extension/app/content/services/form/manager';
import { createInlineRelay } from 'proton-pass-extension/app/content/services/inline/inline.relay';
import { createInlineService } from 'proton-pass-extension/app/content/services/inline/inline.service';
import { createWebAuthNService } from 'proton-pass-extension/app/content/services/webauthn';
import { IGNORED_TAGS } from 'proton-pass-extension/app/content/utils/nodes';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { FieldType } from '@proton/pass/fathom';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import { AppStatus } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { CSContext } from './context';
import type { CSContextState, ContentScriptContext } from './types';
import { hasPauseCriteria } from './utils';

export type ContentScriptContextFactoryOptions = {
    scriptId: string;
    mainFrame: boolean;
    elements: PassElementsConfig;
    controller: ClientController;
    destroy: (options: { reason: string }) => void;
};

export const createContentScriptContext = (options: ContentScriptContextFactoryOptions): ContentScriptContext => {
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
        channel: options.controller.channel,

        service: {
            autofill: createAutofillService(options),
            autosave: options.mainFrame ? createAutosaveService() : createAutosaveRelay(),
            detector: createDetectorService({
                ...(options.mainFrame ? {} : { fieldTypes: [FieldType.CREDIT_CARD] }),
                onBottleneck: ({ detectionTime }) => {
                    logger.info(`[Detector] Prediction bottleneck detected [${detectionTime}ms]`);
                    context.destroy({ reason: 'bottleneck' });
                },
            }),
            formManager: createFormManager({
                onDetection: async (forms) => {
                    /* attach or detach dropdown based on the detection results */
                    const didDetect = forms.length > 0;
                    if (!didDetect) context.service.inline.dropdown.destroy();
                    else {
                        context.service.inline.dropdown.attach();
                        await context.service.autofill.sync().catch(noop);

                        /** Always prompt for OTP autofill before autosave to support
                         * OTP -> autosave sequence on SPA websites */
                        const promptedOTP = await context.service.autofill.evaluateOTP(forms);
                        await (!promptedOTP && context.service.autosave.reconciliate());
                    }
                },
            }),

            inline: options.mainFrame ? createInlineService(options) : createInlineRelay(options),
            webauthn: options.mainFrame ? createWebAuthNService() : undefined,
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
                Autosave: autosave.prompt && !hasPause.Autosave,
                AutosuggestAlias: autosuggest.email && !hasPause.Autosuggest,
                AutosuggestPassword: autosuggest.password && !hasPause.Autosuggest,
                CreditCard: Boolean(autofill.cc) && !hasPause.Autofill,
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

    return context;
};
