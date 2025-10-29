import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';

import { enableLoginAutofill } from '@proton/pass/lib/settings/utils';

export const canProcessAction = withContext<(action: DropdownAction) => boolean>((ctx, action) => {
    const features = ctx?.getFeatures();
    const settings = ctx?.getSettings();
    const autofillEnabled = settings?.autofill && enableLoginAutofill(settings.autofill);

    switch (action) {
        case DropdownAction.AUTOFILL_LOGIN:
            return Boolean(features?.Autofill && (settings?.autofill.login ?? autofillEnabled));
        case DropdownAction.AUTOFILL_IDENTITY:
            return Boolean(features?.Autofill && (settings?.autofill.identity ?? autofillEnabled));
        case DropdownAction.AUTOSUGGEST_ALIAS:
            return features?.AutosuggestAlias ?? false;
        case DropdownAction.AUTOSUGGEST_PASSWORD:
            return features?.AutosuggestPassword ?? false;
        case DropdownAction.AUTOFILL_CC:
            return Boolean(features?.CreditCard);
    }
});

/** Flags an element to block certain autofill/autosave actions triggered on focus
 * in/out events. This is necessary as we cannot directly attach data to these DOM
 * events, so we rely on Element flags. Returns a function to release the trap. */
export const createElementTrap = <K extends string>(element: HTMLElement, key: K) => {
    const el = element as Record<K, boolean>;
    const state: { timer?: NodeJS.Timeout } = {};

    const release = () => {
        el[key] = false;
        clearTimeout(state.timer);
        delete state.timer;
    };

    return {
        release,

        isTrapped: () => el[key] === true,

        trap: (duration: number) => {
            clearTimeout(state.timer);
            el[key] = true;

            state.timer = setTimeout(() => {
                el[key] = false;
                delete state.timer;
            }, duration);

            return release;
        },
    };
};
