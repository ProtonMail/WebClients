import type { AutofillService } from 'proton-pass-extension/app/content/services/autofill/autofill.service';
import type { AutosaveService } from 'proton-pass-extension/app/content/services/autosave/autosave.abstract';
import type { FrameMessageBroker } from 'proton-pass-extension/app/content/services/client/client.channel';
import type { ClientObserver } from 'proton-pass-extension/app/content/services/client/client.observer';
import type { DetectorService } from 'proton-pass-extension/app/content/services/detector/detector.service';
import type { FormManager } from 'proton-pass-extension/app/content/services/form/form.manager';
import type { AbstractInlineService } from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import type { PasskeyService } from 'proton-pass-extension/app/content/services/webauthn/passkey.service';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, Maybe } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

export type CSContextState = AppState & { stale: boolean; ready: boolean };

export type CSFeatures =
    | 'Autofill'
    | 'Autofill2FA'
    | 'Autosave'
    | 'AutosuggestAlias'
    | 'AutosuggestPassword'
    | 'CreditCard'
    | 'Passkeys';

export interface ContentScriptContext {
    /** Wether this script is in the top-frame */
    mainFrame: boolean;
    /** Random identifier for the current content-script */
    scriptId: string;
    /** Custom elements configuration */
    elements: PassElementsConfig;
    channel: FrameMessageBroker;
    observer: ClientObserver;

    service: {
        autofill: AutofillService;
        autosave: AutosaveService;
        detector: DetectorService;
        formManager: FormManager;
        inline: AbstractInlineService;
        passkey: Maybe<PasskeyService>;
    };

    destroy: (options: { reason: string }) => void;
    getExtensionContext: () => Maybe<ExtensionContextType>;
    getFeatureFlags: () => FeatureFlagState;
    getFeatures: () => Record<CSFeatures, boolean>;
    getSettings: () => ProxiedSettings;
    getState: () => CSContextState;
    setFeatureFlags: (update: FeatureFlagState) => void;
    setSettings: (update: Partial<ProxiedSettings>) => void;
    setState: (update: Partial<CSContextState>) => void;
}
