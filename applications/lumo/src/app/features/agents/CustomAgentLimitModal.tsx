import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoPlusLimitModal } from '../../components/Modals/LumoPlusLimitModal';

export const CustomAgentLimitModal = (modalProps: ModalProps) => {
    // translator: Title of the custom agent upgrade modal. ${LUMO_SHORT_APP_NAME} is the app name, also used to name custom agents; ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
    const title = c('collider_2025:Title').t`More custom ${LUMO_SHORT_APP_NAME}s with ${PLAN_NAMES[PLANS.LUMO]}`;
    // translator: Upgrade description. ${LUMO_SHORT_APP_NAME} is the app name, also used to name custom agents; ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
    const description = c('collider_2025:Info')
        .t`Upgrade to ${PLAN_NAMES[PLANS.LUMO]} to create unlimited custom ${LUMO_SHORT_APP_NAME}s, unlock advanced AI models, and more.`;
    // translator: Paid-plan benefit. ${LUMO_SHORT_APP_NAME} is the app name, also used to name custom agents.
    const limitFeature = c('collider_2025:Feature').t`Unlimited custom ${LUMO_SHORT_APP_NAME}s`;

    return <LumoPlusLimitModal {...modalProps} title={title} description={description} limitFeature={limitFeature} />;
};
