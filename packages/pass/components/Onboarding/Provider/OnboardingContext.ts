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
    hidden?: boolean;
    key: string;
    title: string;
    shortTitle: string;
};

export type OnboardingContextValue = {
    acknowledge: () => void;
    launch: () => void;
    markCompleted: (step: string) => void;
    enabled: boolean;
    isActive: boolean;
    type: OnboardingType;
    steps: OnboardingStep[];
    completed: string[];
};

export const OnboardingContext = createContext<OnboardingContextValue>({
    acknowledge: noop,
    launch: noop,
    markCompleted: noop,
    enabled: false,
    isActive: false,
    type: OnboardingType.WELCOME,
    steps: [],
    completed: [],
});
