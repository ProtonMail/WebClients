import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';

import { LumoPlusLimitModal } from '../../../components/Modals/LumoPlusLimitModal';

export const ProjectLimitModal = (modalProps: ModalProps) => {
    // translator: Title of the project upgrade modal. ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
    const title = c('collider_2025:Title').t`More Projects with ${PLAN_NAMES[PLANS.LUMO]}`;
    // translator: Upgrade description. ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
    const description = c('collider_2025:Info')
        .t`Upgrade to ${PLAN_NAMES[PLANS.LUMO]} to create unlimited projects, unlock advanced AI models, and more.`;
    // translator: Upgrade benefit in the project limit modal. Projects are Lumo workspaces that group chats, instructions, and files; the paid plan has no limit on the number of projects a user can create.
    const limitFeature = c('collider_2025:Feature').t`Unlimited projects`;

    return <LumoPlusLimitModal {...modalProps} title={title} description={description} limitFeature={limitFeature} />;
};
