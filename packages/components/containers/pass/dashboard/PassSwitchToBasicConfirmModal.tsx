import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcDevices } from '@proton/icons/icons/IcDevices';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcVault } from '@proton/icons/icons/IcVault';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../../components/modalTwo/useModalState';
import StripedItem from '../../../components/stripedList/StripedItem';
import { StripedList } from '../../../components/stripedList/StripedList';
import { PASS_BASIC_DEVICES, PASS_BASIC_MAX_USERS, PASS_BASIC_VAULTS } from '../../payments/features/pass';
import { useSubscriptionModalRaw } from '../../payments/subscription/subscriptionModalContext';

const DowngradedFeature = ({ before, after }: { before: string; after: string }) => (
    <>
        <span className="text-strike">{before}</span>
        {` → ${after}`}
    </>
);

/**
 * Reusable "are you sure" confirmation shown before opening the Pass Basic checkout from a Pass
 * Professional/Business trial. Owns the confirm action itself (opens the checkout on confirm), so
 * any trigger across the app only needs to open this modal - no callback wiring required.
 */
const PassSwitchToBasicConfirmModal = (modalProps: ModalStateProps) => {
    const openSubscriptionModal = useSubscriptionModalRaw();
    const passBusinessPlanTitle = PLAN_NAMES[PLANS.PASS_BUSINESS];
    const passBasicPlanTitle = PLAN_NAMES[PLANS.PASS_BASIC];

    const handleConfirm = () => {
        modalProps.onClose?.();
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.PASS_BASIC,
            cycle: CYCLE.MONTHLY,
            disablePlanSelection: true,
        });
    };

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader title={c('pass_signup_2024: Title').t`Downgrade to ${passBasicPlanTitle}`} />
            <ModalTwoContent>
                <p className="mt-0 mb-2">
                    {c('pass_signup_2024: Info')
                        .t`${passBasicPlanTitle} is free. Your account stays active. Your passwords, passkeys, and notes are safe in your vault, ready to autofill.`}
                </p>
                <p className="text-semibold mt-6 mb-2">{c('pass_signup_2024: Info').t`You'll lose access to:`}</p>
                <StripedList alternate="odd">
                    <StripedItem left={<IcUsers className="shrink-0 color-success" size={5} />}>
                        <DowngradedFeature
                            before={c('pass_signup_2024: Info').t`Unlimited seats`}
                            after={c('pass_signup_2024: Info').ngettext(
                                msgid`${PASS_BASIC_MAX_USERS}-seat limit`,
                                `${PASS_BASIC_MAX_USERS}-seat limit`,
                                PASS_BASIC_MAX_USERS
                            )}
                        />
                    </StripedItem>
                    <StripedItem left={<IcDevices className="shrink-0 color-success" size={5} />}>
                        <DowngradedFeature
                            before={c('pass_signup_2024: Info').t`Unlimited devices`}
                            after={c('pass_signup_2024: Info').ngettext(
                                msgid`${PASS_BASIC_DEVICES} device per user`,
                                `${PASS_BASIC_DEVICES} devices per user`,
                                PASS_BASIC_DEVICES
                            )}
                        />
                    </StripedItem>
                    <StripedItem left={<IcVault className="shrink-0 color-success" size={5} />}>
                        <DowngradedFeature
                            before={c('pass_signup_2024: Info').t`Unlimited vaults`}
                            after={c('pass_signup_2024: Info').ngettext(
                                msgid`${PASS_BASIC_VAULTS} vault per user`,
                                `${PASS_BASIC_VAULTS} vaults per user`,
                                PASS_BASIC_VAULTS
                            )}
                        />
                    </StripedItem>
                    <StripedItem left={<IcCross className="shrink-0 color-danger" size={5} />}>
                        {c('pass_signup_2024: Info').t`No policy management`}
                    </StripedItem>
                    <StripedItem left={<IcCross className="shrink-0 color-danger" size={5} />}>
                        {c('pass_signup_2024: Info').t`No reporting`}
                    </StripedItem>
                    <StripedItem left={<IcCross className="shrink-0 color-danger" size={5} />}>
                        {c('pass_signup_2024: Info').t`No ${DARK_WEB_MONITORING_NAME}`}
                    </StripedItem>
                </StripedList>
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch gap-2">
                <Button color="norm" onClick={handleConfirm} data-testid="confirm-switch-to-pass-basic">{c(
                    'pass_signup_2024: Action'
                ).t`Confirm downgrade`}</Button>
                <Button shape="ghost" color="norm" onClick={modalProps.onClose}>{c('pass_signup_2024: Action')
                    .t`Keep ${passBusinessPlanTitle}`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PassSwitchToBasicConfirmModal;
