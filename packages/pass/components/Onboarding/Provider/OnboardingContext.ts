import { createContext } from 'react';

import type { OnboardingStatus } from '@proton/pass/store/selectors';
import noop from '@proton/utils/noop';

export type OnboardingContextValue = {
    acknowledge: () => void;
    complete: boolean;
    enabled: boolean;
    state: OnboardingStatus;
    steps: { done: number; total: number };
    launch: () => void;
    isActive: boolean;
};

export const OnboardingContext = createContext<OnboardingContextValue>({
    acknowledge: noop,
    launch: noop,
    complete: false,
    enabled: false,
    isActive: false,
    state: {
        vaultCreated: false,
        vaultImported: false,
        vaultShared: false,
    },
    steps: { done: 0, total: 0 },
});
