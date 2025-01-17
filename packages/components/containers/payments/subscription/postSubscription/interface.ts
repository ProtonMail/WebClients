import type { ReactNode } from 'react';

import type { FeatureTourStepId } from '@proton/components/components/featureTour/interface';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { SUBSCRIPTION_STEPS } from '../constants';

export type PostSubscriptionFlowName =
    // Generic flow is used from specific plans
    | 'generic'
    // Other flows are used from upsells
    | 'dark-web-monitoring'
    | 'mail-auto-delete'
    | 'mail-folders'
    | 'mail-labels'
    | 'mail-short-domain'
    | 'sentinel';
export interface PostSubscriptionModalComponentProps {
    modalProps: ModalStateProps;
    step: SUBSCRIPTION_STEPS;
    /** Close modal and display feature tour */
    onDisplayFeatureTour: () => void;
    /** Close modal and execute remind me later action */
    onRemindMeLater: () => void;
}

export type PostSubscriptionModalConfig = {
    modal: (props: PostSubscriptionModalComponentProps) => ReactNode;
    /** Feature tour steps suggested for display after post subscription modal closes. */
    featureTourSteps: FeatureTourStepId[];
};
