import useLocalState from '@proton/components/hooks/useLocalState';

import { defaultPersistentKey } from '../../../public/helper';
import { RememberMode } from '../../rememberMode';

/** "Keep me signed in": the user's saved choice, unless the page forces it on or hides the checkbox. */
export const useRememberPreference = (remember: RememberMode) => {
    const [savedPersistent, setSavedPersistent] = useLocalState(false, defaultPersistentKey);
    const persistent =
        remember === RememberMode.Enabled || remember === RememberMode.HiddenEnabled ? true : savedPersistent;
    return {
        persistent,
        showCheckbox: remember === RememberMode.Visible || remember === RememberMode.Enabled,
        toggle: () => setSavedPersistent(!persistent),
    };
};

export type RememberPreference = ReturnType<typeof useRememberPreference>;
