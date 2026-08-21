import { type ComponentType, createContext, useContext } from 'react';

import type { PLANS } from '@proton/payments/core/constants';
import noop from '@proton/utils/noop';

export enum OnboardingType {
    WELCOME = 'WELCOME',
    B2B = 'B2B',
}

export type AvailablePlans = PLANS.PASS | PLANS.BUNDLE;

export type OnboardingStep = {
    action?: () => void;
    actionClassName?: string;
    actionText?: string;
    component: ComponentType;
    description: ComponentType;
    group?: string;
    key: string;
    shortTitle: string;
    title: string;
    withHeader?: boolean;
};

export type OnboardingContextValue<T = any> = {
    acknowledge: () => void;
    launch: () => void;
    markCompleted: (step: string) => void;
    completed: string[];
    enabled: boolean;
    isActive: boolean;
    steps: OnboardingStep[];
    type: OnboardingType;
    selected?: T;
    setSelected?: (v: T) => void;
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

export const useOnboarding = <T = any,>() => useContext(OnboardingContext) as OnboardingContextValue<T>;
