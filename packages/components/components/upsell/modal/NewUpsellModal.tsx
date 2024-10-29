import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms';
import type { ModalSize, ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, Price, SettingsLink, usePlans } from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import { type Currency, PLANS } from '@proton/payments';
import { APPS, type APP_NAMES, CYCLE, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
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
    description: string;
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
    const mailPlus = plansResult?.plans?.find(({ Name }) => Name === PLANS.MAIL);

    const amount = (mailPlus?.DefaultPricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const priceMailPlus = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {amount}
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
            {submitText || c('new_plans: Action').t`Upgrade to ${MAIL_SHORT_APP_NAME} Plus`}
        </ButtonLike>
    );

    const footerTextModal = footerText || c('new_plans: Action').jt`Starting from ${priceMailPlus}`;

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
                    <p className="mt-2 mb-6 text-wrap-balance color-weak">{description}</p>
                    <div>{upgradeButton}</div>
                    <p className="mt-2 text-sm color-weak">{footerTextModal}</p>
                </ModalTwoContent>
            </div>
        </ModalTwo>
    );
};

export default NewUpsellModal;
