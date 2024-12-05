import type { ReactNode } from 'react';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { SUBSCRIPTION_STEPS } from '../constants';

export type PostSubscriptionFlowName = 'mail-short-domain';

export interface PostSubscriptionModalComponentProps {
    modalProps: ModalStateProps;
    step: SUBSCRIPTION_STEPS;
}

export type PostSubscriptionModalConfig = {
    modal: (props: PostSubscriptionModalComponentProps) => ReactNode;
};
