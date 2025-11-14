import { createAutofillService } from 'proton-pass-extension/app/content/services/autofill/autofill.service';
import { createAutosaveRelay } from 'proton-pass-extension/app/content/services/autosave/autosave.relay';
import { createAutosaveService } from 'proton-pass-extension/app/content/services/autosave/autosave.service';
import type { ClientController } from 'proton-pass-extension/app/content/services/client/client.controller';
import { createDetectorService } from 'proton-pass-extension/app/content/services/detector/detector.service';
import { IGNORED_TAGS } from 'proton-pass-extension/app/content/services/detector/detector.utils';
import { createFormManager } from 'proton-pass-extension/app/content/services/form/form.manager';
import { createInlineRelay } from 'proton-pass-extension/app/content/services/inline/inline.relay';
import { createInlineService } from 'proton-pass-extension/app/content/services/inline/inline.service';
import { createPasskeyService } from 'proton-pass-extension/app/content/services/webauthn/passkey.service';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { FieldType } from '@proton/pass/fathom/labels';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import { AppStatus } from '@proton/pass/types';
import type { PassFeature } from '@proton/pass/types/api/features';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { CSContext } from './context';
import type { CSContextState, ContentScriptContext } from './types';
import { DEFAULT_PAUSE_CRITERIAS, combinePauseCriteria, hasPauseCriteria } from './utils';

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
        observer: options.controller.observer,

        service: {
            autofill: createAutofillService(options),

            autosave: options.mainFrame ? createAutosaveService() : createAutosaveRelay(),

            detector: createDetectorService({
                ...(options.mainFrame ? {} : { fieldTypes: [FieldType.CREDIT_CARD] }),
                root: document,
                onBottleneck: ({ detectionTime }) => {
                    logger.info(`[Detector] Prediction bottleneck detected [${detectionTime}ms]`);
                    context.destroy({ reason: 'bottleneck' });
                },
            }),

            formManager: createFormManager({
                channel: options.controller.channel,
                onDetection: async (forms) => {
                    /* attach or detach dropdown based on the detection results */
                    if (forms.length === 0) context.service.inline.dropdown.destroy();
                    else {
                        context.service.inline.dropdown.attach();
                        await context.service.autofill.sync().catch(noop);
                    }

                    /** Always prompt for OTP autofill before autosave to support
                     * OTP -> autosave sequence on SPA websites */
                    const promptedOTP = await context.service.autofill.evaluateOTP(forms);
                    await (!promptedOTP && context.service.autosave.reconciliate());
                },
            }),

            inline: options.mainFrame ? createInlineService(options) : createInlineRelay(options),
            passkey: options.mainFrame ? createPasskeyService() : undefined,
        },

        destroy: options.destroy,
        getExtensionContext: () => ExtensionContext.read(),
        getFeatureFlags: () => featureFlags,
        getFeatures: () => {
            const { disallowedDomains } = settings ?? {};
            const { autofill, autosuggest, autosave, passkeys } = settings;
            const { url, tabUrl } = context.getExtensionContext() ?? {};

            const criterias = [url, tabUrl].filter(truthy).map((url) => hasPauseCriteria({ disallowedDomains, url }));
            const hasPause = criterias.length > 0 ? criterias.reduce(combinePauseCriteria) : DEFAULT_PAUSE_CRITERIAS;

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
