import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoPlusLimitModal } from '../../../../components/Modals/LumoPlusLimitModal';
import { SCHEDULE_TIER_LIMITS } from '../../scheduleEntitlements';
import type { ScheduleLimitModalState } from '../../useScheduleLimit';

export const ScheduleLimitModal = ({
    scheduleLimit,
    upgradePath,
    ...modalProps
}: ModalProps & ScheduleLimitModalState) => {
    // translator: Current plan allowance in the scheduled task limit dialog. ${scheduleLimit} includes paused tasks.
    const limitText = c('collider_2025:Info').ngettext(
        msgid`Your current plan includes up to ${scheduleLimit} scheduled task.`,
        `Your current plan includes up to ${scheduleLimit} scheduled tasks.`,
        scheduleLimit
    );
    // translator: Explains how to free up capacity at the scheduled task limit; pausing a task does not free a slot.
    const manageText = c('collider_2025:Info')
        .t`Paused tasks count toward this limit. Delete a task to create another.`;

    if (upgradePath !== 'checkout') {
        // translator: Heading shown when the user cannot create another scheduled task on their current plan.
        const title = c('collider_2025:Title').t`You've reached your scheduled task limit`;
        // translator: Guidance for an organization member without a paid seat. ${LUMO_SHORT_APP_NAME} is the product name.
        const adminText = c('collider_2025:Info')
            .t`Ask your organization's administrator for a ${LUMO_SHORT_APP_NAME} seat to create more scheduled tasks.`;
        return (
            <ModalTwo {...modalProps} size="small">
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <p className="mt-0 color-weak">{limitText}</p>
                    <p className="m-0 color-weak">{upgradePath === 'admin' ? adminText : manageText}</p>
                </ModalTwoContent>
                <ModalTwoFooter className="justify-end">
                    <Button color="norm" onClick={modalProps.onClose}>{c('collider_2025:Action').t`Got it`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    const plan = PLAN_NAMES[PLANS.LUMO];
    const plusLimit = SCHEDULE_TIER_LIMITS.plus;
    // translator: Title of the scheduled task upgrade modal. ${plan} is the paid plan name.
    const title = c('collider_2025:Title').t`More scheduled tasks with ${plan}`;
    // translator: ${plan} is the paid plan name; ${plusLimit} is its maximum number of scheduled tasks.
    const upgradeText = c('collider_2025:Info')
        .t`Upgrade to ${plan} to create up to ${plusLimit} scheduled tasks, unlock advanced AI models, and more.`;
    const description = `${limitText} ${upgradeText} ${manageText}`;
    // translator: Feature in the upgrade list. ${plusLimit} is the maximum number of scheduled tasks allowed.
    const limitFeature = c('collider_2025:Feature').t`Up to ${plusLimit} scheduled tasks`;

    return <LumoPlusLimitModal {...modalProps} title={title} description={description} limitFeature={limitFeature} />;
};
