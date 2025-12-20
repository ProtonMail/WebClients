import { DEFAULT_PAUSE_CRITERIAS, combinePauseCriteria, hasPauseCriteria } from '@proton/pass/lib/settings/pause-list';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type ComputedFeatures = {
    Autofill: boolean;
    Autofill2FA: boolean;
    Autosave: boolean;
    AutosuggestAlias: boolean;
    AutosuggestPassword: boolean;
    CreditCard: boolean;
    Passkeys: boolean;
};

export const computeFeatures = (
    settings: ProxiedSettings,
    frameUrl: MaybeNull<ParsedUrl>,
    tabUrl: MaybeNull<ParsedUrl>
): ComputedFeatures => {
    const { disallowedDomains } = settings;
    const { autofill, autosuggest, autosave, passkeys } = settings;

    const criterias = [frameUrl, tabUrl].filter(truthy).map((url) => hasPauseCriteria({ disallowedDomains, url }));
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
};

export const shouldEnableDetector = (features: ComputedFeatures): boolean =>
    features.Autofill ||
    features.Autofill2FA ||
    features.Autosave ||
    features.AutosuggestAlias ||
    features.AutosuggestPassword ||
    features.CreditCard;

export const shouldInjectContentScript = (features: ComputedFeatures): boolean =>
    shouldEnableDetector(features) || features.Passkeys;
