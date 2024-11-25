import type { ReactNode } from 'react';

import type { SUBSCRIPTION_STEPS } from '../constants';

export type PostSubscriptionFlowName = 'mail-short-domain';

export interface PostSubscriptionModalComponentProps {
    onClose: () => void;
    step: SUBSCRIPTION_STEPS;
}

export type PostSubscriptionModalConfig = {
    modal: (props: PostSubscriptionModalComponentProps) => ReactNode;
};
