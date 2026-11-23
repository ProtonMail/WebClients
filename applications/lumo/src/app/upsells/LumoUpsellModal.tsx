import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Loader } from '@proton/atoms/Loader/Loader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import { IcCross } from '@proton/icons/icons/IcCross';
import type { Currency } from '@proton/payments/core/interface';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoUpsellModalPlus from '@proton/styles/assets/img/lumo/lumo-upsell-modal-plus.svg';
import lumoUpsellModalBusiness from '@proton/styles/assets/img/lumo/lumo-upsell-modal-pro.svg';
import clsx from '@proton/utils/clsx';

import { type IconName, LumoIcon } from '../components/LumoIcon/LumoIcon';
import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../providers/LumoPlanProvider';

import './LumoPlusUpsellModal.scss';

export type UpsellAudience = 'personal' | 'business';

interface PlanFeature {
    icon: IconName;
    getText: () => string;
}

const plusFeatures: PlanFeature[] = [
    {
        icon: 'Lightbulb',
        getText: () => c('collider_2025: Characteristic').t`More Max model usage`,
    },
    {
        icon: 'MessageCircleMore',
        getText: () => c('collider_2025: Characteristic').t`More messages & chat history`,
    },
    {
        icon: 'ImagePlus',
        getText: () => c('collider_2025: Characteristic').t`More image generations`,
    },
    {
        icon: 'FolderOpen',
        getText: () => c('collider_2025: Characteristic').t`Unlimited Projects`,
    },
    {
        icon: 'BotMessageSquare',
        getText: () => c('collider_2025: Characteristic').t`Unlimited Custom Lumos`,
    },
];

const businessFeatures: PlanFeature[] = [
    ...plusFeatures,
    {
        icon: 'UserCog',
        getText: () => c('collider_2025: Characteristic').t`Administrative tools`,
    },
];

interface UpsellPlanPricing {
    planName: string;
    currency: Currency;
    monthlyAmount?: number;
    ctaText: string;
}

interface Props {
    modalProps: ModalStateProps;
    plusPlan: UpsellPlanPricing;
    businessPlan: UpsellPlanPricing;
    onUpgrade: (audience: UpsellAudience) => void;
    loading?: boolean;
}

const LumoUpsellModal = ({ modalProps, plusPlan, businessPlan, onUpgrade, loading = false }: Props) => {
    const { canShowLumoUpsellB2B } = useLumoPlan();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const [audience, setAudience] = useState<UpsellAudience>(canShowLumoUpsellB2B ? 'business' : 'personal');

    const isBusinessAudience = audience === 'business';
    const activePlan = isBusinessAudience ? businessPlan : plusPlan;
    const activeFeatures = isBusinessAudience ? businessFeatures : plusFeatures;

    const modalTitle = useMemo(() => {
        if (isBusinessAudience) {
            return c('collider_2025: Upsell Title').t`Upgrade to ${LUMO_SHORT_APP_NAME} Pro`;
        }

        return c('collider_2025: Upsell Title').t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus`;
    }, [isBusinessAudience]);

    const ctaContent = loading ? (
        <Loader size="medium" />
    ) : (
        <Button
            color="norm"
            shape="solid"
            size="large"
            fullWidth
            className="lumo-payment-trigger"
            onClick={() => onUpgrade(audience)}
        >
            {activePlan.ctaText}
        </Button>
    );

    return (
        <>
            {createPortal(
                <Tooltip title={c('collider_2025:Action').t`Close`}>
                    <button
                        type="button"
                        className="lumo-upsell-modal-close p-0 inline-flex items-center justify-center border lumo-color-glyph"
                        onClick={modalProps.onClose}
                        aria-label={c('collider_2025:Action').t`Close`}
                    >
                        <IcCross size={4} />
                    </button>
                </Tooltip>,
                document.body
            )}

            <ModalTwo
                className={clsx('modal-two--upsell-lumoplus', isSmallScreen && 'modal-two--upsell-lumoplus--small')}
                enableCloseWhenClickOutside
                {...modalProps}
            >
                <ModalTwoContent unstyled>
                    <div
                        className={clsx(
                            'lumo-upsell-modal gap-6 p-6 pb-8',
                            isSmallScreen && 'lumo-upsell-modal--small'
                        )}
                    >
                        <div className="lumo-upsell-modal-header">
                            <h1 className={clsx('lumo-upsell-modal-title m-0 main-text', isSmallScreen && 'small')}>
                                {modalTitle}
                            </h1>
                        </div>

                        <div className="lumo-upsell-audience-toggle-wrapper">
                            <div
                                className="lumo-upsell-audience-toggle gap-1 p-1"
                                role="tablist"
                                aria-label={c('Title').t`Plan type`}
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={audience === 'personal'}
                                    className={clsx(
                                        'lumo-upsell-audience-toggle-item py-2 px-6 lumo-label-large lumo-color-glyph',
                                        audience === 'personal' && 'is-selected'
                                    )}
                                    onClick={() => setAudience('personal')}
                                >
                                    {c('collider_2025: Plan Name').t`Personal`}
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={audience === 'business'}
                                    className={clsx(
                                        'lumo-upsell-audience-toggle-item py-2 px-6 lumo-label-large lumo-color-glyph',
                                        audience === 'business' && 'is-selected'
                                    )}
                                    onClick={() => setAudience('business')}
                                >
                                    {c('collider_2025: Plan Name').t`Business`}
                                </button>
                            </div>
                        </div>

                        <div className="lumo-upsell-plan-card-shell p-2.5">
                            <div className="lumo-upsell-plan-card p-7 lumo-bg-panel lumo-elevation-4">
                                {isSmallScreen ? (
                                    <>
                                        <img
                                            src={isBusinessAudience ? lumoUpsellModalBusiness : lumoUpsellModalPlus}
                                            alt=""
                                            className="lumo-upsell-plan-image p-4 pb-0"
                                        />
                                        <ul className="lumo-upsell-features gap-4 pt-3 unstyled m-0">
                                            {activeFeatures.map((feature) => (
                                                <li
                                                    key={feature.icon}
                                                    className="lumo-upsell-feature gap-3 lumo-body-medium lumo-color-glyph"
                                                >
                                                    <LumoIcon
                                                        name={feature.icon}
                                                        size={16}
                                                        className="lumo-color-glyph-brand-text shrink-0"
                                                    />
                                                    <span>{feature.getText()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="lumo-upsell-plan-name m-0 main-text medium">
                                            {activePlan.planName}
                                        </h2>

                                        {activePlan.monthlyAmount !== undefined && (
                                            <div className="lumo-upsell-pricing">
                                                <span className="lumo-upsell-pricing-label lumo-color-glyph-mid">
                                                    {c('collider_2025: Upsell Title').t`From only`}
                                                </span>
                                                <Price
                                                    className="lumo-upsell-price my-1"
                                                    currency={activePlan.currency}
                                                >
                                                    {activePlan.monthlyAmount}
                                                </Price>
                                                <span className="lumo-upsell-pricing-sublabel lumo-body-large lumo-color-glyph-mid">
                                                    {isBusinessAudience
                                                        ? c('Subtitle').t`per user/month, billed annually`
                                                        : c('Subtitle').t`per month, billed annually`}
                                                </span>
                                            </div>
                                        )}

                                        <div className="lumo-upsell-cta pt-1">{ctaContent}</div>

                                        <ul className="lumo-upsell-features gap-4 pt-3 unstyled m-0">
                                            {activeFeatures.map((feature) => (
                                                <li
                                                    key={feature.icon}
                                                    className="lumo-upsell-feature gap-3 lumo-body-medium lumo-color-glyph"
                                                >
                                                    <LumoIcon
                                                        name={feature.icon}
                                                        size={16}
                                                        className="lumo-color-glyph-brand-text shrink-0"
                                                    />
                                                    <span>{feature.getText()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </div>

                        {isSmallScreen && <div className="lumo-upsell-cta pt-1">{ctaContent}</div>}
                    </div>
                </ModalTwoContent>
            </ModalTwo>
        </>
    );
};

export default LumoUpsellModal;
