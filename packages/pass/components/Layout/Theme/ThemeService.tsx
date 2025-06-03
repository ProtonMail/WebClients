import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import type { Maybe } from '@proton/pass/types';
import type { ObservableState } from '@proton/pass/utils/pubsub/state';
import { createObservableState } from '@proton/pass/utils/pubsub/state';
import noop from '@proton/utils/noop';

type PassThemeServiceConfig = {
    /** Resolves the initial theme. This is required in order to resolve
     * the proxied theme setting stored locally before state hydration */
    getTheme: () => Promise<Maybe<PassThemeOption>>;
};

export type PassThemeService = ObservableState<PassThemeOption> & { sync: () => void };

export const createPassThemeManager = (config: PassThemeServiceConfig): PassThemeService => {
    const state = createObservableState<PassThemeOption>(PASS_DEFAULT_THEME);
    return {
        ...state,
        sync: () => {
            config
                .getTheme()
                .then((theme) => state.setState(theme ?? PASS_DEFAULT_THEME))
                .catch(noop);
        },
    };
};
