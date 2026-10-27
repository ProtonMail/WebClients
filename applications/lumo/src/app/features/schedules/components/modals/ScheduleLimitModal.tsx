import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';

import { LumoPlusLimitModal } from '../../../../components/Modals/LumoPlusLimitModal';

export const ScheduleLimitModal = (modalProps: ModalProps) => {
    // translator: Title of the scheduled task upgrade modal. ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
    const title = c('collider_2025:Title').t`More scheduled tasks with ${PLAN_NAMES[PLANS.LUMO]}`;
    // translator: Upgrade description. ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name; it allows up to three scheduled tasks.
    const description = c('collider_2025:Info')
        .t`Upgrade to ${PLAN_NAMES[PLANS.LUMO]} to create up to 3 scheduled tasks, unlock advanced AI models, and more.`;
    // translator: Feature allowing a maximum of three scheduled tasks with the paid plan.
    const limitFeature = c('collider_2025:Feature').t`Up to 3 scheduled tasks`;

    return <LumoPlusLimitModal {...modalProps} title={title} description={description} limitFeature={limitFeature} />;
};
