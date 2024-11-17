import { type ReactNode, createContext } from 'react';

import noop from '@proton/utils/noop';

export enum OnboardingType {
    WELCOME = 'WELCOME',
    B2B = 'B2B',
}

export type OnboardingStep = {
    action?: () => void;
    actionText?: string;
    component: ReactNode;
    description: ReactNode;
    group: string;
    key: string;
    shortTitle: string;
    title: string;
};

export type OnboardingContextValue = {
    acknowledge: () => void;
    launch: () => void;
    markCompleted: (step: string) => void;
    completed: string[];
    enabled: boolean;
    isActive: boolean;
    steps: OnboardingStep[];
    type: OnboardingType;
};

export const OnboardingContext = createContext<OnboardingContextValue>({
    acknowledge: noop,
    launch: noop,
    markCompleted: noop,
    completed: [],
    enabled: false,
    isActive: false,
    steps: [],
    type: OnboardingType.WELCOME,
});
