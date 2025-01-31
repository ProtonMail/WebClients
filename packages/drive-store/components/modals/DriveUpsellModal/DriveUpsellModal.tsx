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
import UpsellFeatureList from '@proton/components/components/upsell/modal/UpsellFeatureList';
import useApi from '@proton/components/hooks/useApi';
import { useModalTwoStatic } from '@proton/components/index';
import { CYCLE, type Currency, PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import {
    type SourceEventUpsell,
    UPSELL_MODALS_TYPE,
    sendRequestUpsellModalReport,
} from '@proton/shared/lib/helpers/upsell';

import './DriveUpsellModal.scss';

export interface DriveUpsellModalProps {
    ['data-testid']?: string;
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
    closeButtonColor?: 'white' | 'black';
}

const DriveUpsellModal = ({
    'data-testid': dataTestid,
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
    application = APPS.PROTONDRIVE,
    onExit,
    open,
    closeButtonColor,
}: DriveUpsellModalProps & ModalStateProps) => {
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
        onClose();
    };

    const currency: Currency = user?.Currency || 'USD';

    const upgradePlan = user.isFree ? PLANS.DRIVE : PLANS.BUNDLE;

    const [plansResult] = usePlans();
    const plan = plansResult?.plans?.find(({ Name }) => Name === upgradePlan);

    const amount = (plan?.DefaultPricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const priceDrivePlus = (
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
            {submitText || c('new_plans: Action').t`Upgrade`}
        </ButtonLike>
    );

    const footerTextModal = footerText || c('new_plans: Action').jt`Plans starting from ${priceDrivePlus}`;

    return (
        <ModalTwo
            className="modal-two--drive-upsell"
            data-testid={dataTestid}
            onClose={onClose}
            onExit={onExit}
            size={size}
            open={open}
        >
            <ModalTwoHeader closeButtonProps={closeButtonColor ? { style: { color: closeButtonColor } } : undefined} />
            <div className="modal-two-illustration-container relative text-center">
                <img className="w-full" src={illustration} alt="" />
            </div>
            <div className="modal-two-content-container">
                <ModalTwoContent className="mt-8 mb-4 text-center">
                    <h1 className="text-lg text-bold">{titleModal}</h1>
                    {typeof description === 'string' ? (
                        <p className="mt-2 mb-6 color-weak">{description}</p>
                    ) : (
                        <div className="mt-2 mb-6">{description}</div>
                    )}
                    <p className="text-left text-semibold mt-0 mb-2">{c('List title').t`Also included:`}</p>
                    <UpsellFeatureList
                        className="text-left mb-4"
                        hideInfo
                        features={[
                            user.isFree ? 'drive-plus-storage' : '1-tb-secure-storage',
                            'file-sharing',
                            'docs-editor',
                            'photos-backup',
                            'more-premium-features',
                        ]}
                    />
                    <div>{upgradeButton}</div>
                    <p className="mt-2 text-sm color-weak">{footerTextModal}</p>
                </ModalTwoContent>
            </div>
        </ModalTwo>
    );
};

export const useDriveUpsellModal = () => {
    return useModalTwoStatic(DriveUpsellModal);
};
