import { c, msgid } from 'ttag';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';

import useModalState from '../../../components/modalTwo/useModalState';
import { PASS_BASIC_DEVICES, PASS_BASIC_VAULTS } from '../../payments/features/pass';
import PassSwitchToBasicConfirmModal from './PassSwitchToBasicConfirmModal';
import { isAutoAssignedPassProfessionalTrial } from './helpers';

/** Offers the auto-assigned Pass Professional trial a way back to Pass Basic */
const PassSwitchToBasicPrompt = ({ subscription }: { subscription: MaybeFreeSubscription }) => {
    const [paymentMethods, loadingPaymentMethods] = usePaymentMethods();
    const [modalProps, setModalOpen, renderModal] = useModalState();

    if (loadingPaymentMethods || !isAutoAssignedPassProfessionalTrial(subscription, !!paymentMethods?.length)) {
        return null;
    }

    const switchLink = (
        <InlineLinkButton
            key="switch-to-pass-basic"
            onClick={() => setModalOpen(true)}
            data-testid="switch-to-pass-basic"
        >
            {c('Action').t`Switch`}
        </InlineLinkButton>
    );

    const devices = c('pass_signup_2024: Info').ngettext(
        msgid`${PASS_BASIC_DEVICES} device`,
        `${PASS_BASIC_DEVICES} devices`,
        PASS_BASIC_DEVICES
    );
    const vaults = c('pass_signup_2024: Info').ngettext(
        msgid`${PASS_BASIC_VAULTS} vault`,
        `${PASS_BASIC_VAULTS} vaults`,
        PASS_BASIC_VAULTS
    );

    return (
        <>
            <p className="color-weak text-sm m-0 pt-3 mt-1 border-top border-weak">
                {c('pass_signup_2024: Info')
                    .jt`Or stay on ${PLAN_NAMES[PLANS.PASS_BASIC]}, free forever: ${devices}, ${vaults}. ${switchLink}`}
            </p>
            {renderModal && <PassSwitchToBasicConfirmModal {...modalProps} />}
        </>
    );
};

export default PassSwitchToBasicPrompt;
