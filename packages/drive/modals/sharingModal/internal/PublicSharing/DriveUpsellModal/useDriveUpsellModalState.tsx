import type { ReactNode } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalSize } from '@proton/components/components/modalTwo/Modal';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import { CYCLE, type Currency, PLANS } from '@proton/payments';

import type { DriveUpsellModalViewProps } from './DriveUpsellModalView';

export interface DriveUpsellModalProps {
    ['data-testid']?: string;
    titleModal: ReactNode;
    description: ReactNode;
    upgradePath?: string;
    illustration: string;
    onUpgrade?: () => void;
    size?: ModalSize;
    submitText?: ReactNode;
    /**
     * Overrides `submitText`, `position` and `handleUpgrade` as it is a ReactNode
     * replacing submit button
     */
    submitButton?: ReactNode;
    footerText?: ReactNode;
    closeButtonColor?: 'white' | 'black';
}

export type UseDriveUpsellModalStateProps = DriveUpsellModalProps & ModalStateProps;

export const useDriveUpsellModalState = ({
    onClose,
    onUpgrade,
    upgradePath,
    submitText,
    submitButton,
    footerText,
    ...props
}: UseDriveUpsellModalStateProps): DriveUpsellModalViewProps => {
    const [user] = useUser();

    const currency: Currency = user?.Currency || 'USD';
    const upgradePlan = user.isFree ? PLANS.DRIVE : PLANS.BUNDLE;

    const [plansResult] = usePlans();
    const plan = plansResult?.plans?.find(({ Name }) => Name === upgradePlan);
    const amount = (plan?.DefaultPricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const handleUpgrade = () => {
        onUpgrade?.();
        onClose();
    };

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

    const upgradeButton: ReactNode = submitButton || (
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

    const footerTextModal: ReactNode = footerText || c('new_plans: Action').jt`Plans starting from ${priceDrivePlus}`;

    return {
        ...props,
        onClose,
        isFree: user.isFree,
        upgradeButton,
        footerTextModal,
    };
};
