import noop from '@proton/utils/noop';

import { PASS_DEFAULT_THEME } from '../../../constants';
import type { Maybe } from '../../../types';
import type { ObservableState } from '../../../utils/pubsub/state';
import { createObservableState } from '../../../utils/pubsub/state';
import type { PassThemeOption } from './types';

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
