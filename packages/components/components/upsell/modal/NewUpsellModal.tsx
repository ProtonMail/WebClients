import type { ReactNode } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import useApi from '@proton/components/hooks/useApi';
import { type Currency, PLANS, PLAN_NAMES, getPlanByName } from '@proton/payments';
import { APPS, type APP_NAMES, CYCLE } from '@proton/shared/lib/constants';
import {
    type SourceEventUpsell,
    UPSELL_MODALS_TYPE,
    sendRequestUpsellModalReport,
} from '@proton/shared/lib/helpers/upsell';

import './NewUpsellModal.scss';

export interface NewUpsellModalProps {
    ['data-testid']?: string;
    modalProps: ModalStateProps;
    titleModal: ReactNode;
    description: ReactNode;
    upgradePath?: string;
    illustration: string;
    onClose?: () => void;
    onUpgrade?: () => void;
    size?: ModalSize;
    submitText?: ReactNode;
    sourceEvent: SourceEventUpsell;
    upsellModalType?: UPSELL_MODALS_TYPE;
    application?: APP_NAMES;
    /**
     * Overrides `submitText`, `position` and `handleUpgrade` as it is a ReactNode
     * replacing submit button
     */
    submitButton?: ReactNode;
    footerText?: ReactNode;
}

const NewUpsellModal = ({
    'data-testid': dataTestid,
    modalProps,
    titleModal,
    description,
    upgradePath,
    illustration,
    onClose,
    onUpgrade,
    size,
    submitText,
    submitButton,
    footerText,
    sourceEvent,
    upsellModalType = UPSELL_MODALS_TYPE.NEW,
    application = APPS.PROTONMAIL,
}: NewUpsellModalProps) => {
    const api = useApi();
    const [user] = useUser();

    const handleUpgrade = () => {
        sendRequestUpsellModalReport({
            api,
            application,
            sourceEvent,
            upsellModalType,
        });
        onUpgrade?.();
        modalProps.onClose();
    };

    const handleClose = () => {
        onClose?.();
        modalProps.onClose();
    };

    const currency: Currency = user?.Currency || 'USD';

    const [plansResult] = usePlans();

    let planName = PLAN_NAMES[PLANS.MAIL];
    let planID: PLANS = PLANS.MAIL;
    if (user.isPaid) {
        planID = PLANS.BUNDLE;
        planName = PLAN_NAMES[PLANS.BUNDLE];
    }
    const plan = getPlanByName(plansResult?.plans ?? [], planID, currency);
    const cycle = user.isFree ? CYCLE.MONTHLY : CYCLE.YEARLY;
    const planPricePerMonth = (plan?.Pricing?.[cycle] || 0) / cycle;

    const pricing = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {planPricePerMonth}
        </Price>
    );

    const upgradeButton = submitButton || (
        <ButtonLike
            as={upgradePath ? SettingsLink : undefined}
            path={upgradePath || ''}
            onClick={handleUpgrade}
            size="medium"
            color="norm"
            shape="solid"
            fullWidth
        >
            {submitText || c('new_plans: Action').t`Upgrade to ${planName}`}
        </ButtonLike>
    );

    const footerTextModal = footerText || c('new_plans: Action').jt`Starting from ${pricing}`;

    return (
        <ModalTwo
            className="modal-two--twocolors"
            data-testid={dataTestid}
            {...modalProps}
            onClose={handleClose}
            size={size}
        >
            <ModalTwoHeader />
            <div className="modal-two-illustration-container relative text-center">
                <img src={illustration} alt="" />
            </div>
            <div className="modal-two-content-container">
                <ModalTwoContent className="my-8 text-center">
                    <h1 className="text-lg text-bold">{titleModal}</h1>
                    {typeof description === 'string' ? (
                        <p className="mt-2 mb-6 text-wrap-balance color-weak">{description}</p>
                    ) : (
                        <div className="mt-2 mb-6">{description}</div>
                    )}
                    <div>{upgradeButton}</div>
                    <p className="mt-2 text-sm color-weak">{footerTextModal}</p>
                </ModalTwoContent>
            </div>
        </ModalTwo>
    );
};

export default NewUpsellModal;
