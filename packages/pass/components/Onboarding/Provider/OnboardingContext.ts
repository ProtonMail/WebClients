import { createContext } from 'react';

import type { OnboardingStatus } from '@proton/pass/store/selectors';
import noop from '@proton/utils/noop';

export enum OnboardingType {
    WELCOME = 'WELCOME',
    B2B = 'B2B',
}

export type OnboardingContextValue = {
    acknowledge: () => void;
    launch: () => void;
    complete: boolean;
    enabled: boolean;
    isActive: boolean;
    state: OnboardingStatus;
    steps: { done: number; total: number };
    type: OnboardingType;
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
    type: OnboardingType.WELCOME,
});
