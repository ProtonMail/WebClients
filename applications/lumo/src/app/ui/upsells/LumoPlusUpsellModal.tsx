import { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, Price, SettingsLink, useConfig } from '@proton/components';
import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import lumoCatLoaf from '@proton/styles/assets/img/lumo/lumo-cat-loaf-upsell.svg';
import lumoPlusLogo from '@proton/styles/assets/img/lumo/lumo-plus-logo.svg';

import { LUMO_PLUS_FREE_PATH_TO_ACCOUNT } from '../../constants';
import LumoPlusBackdropOverlay from './LumoPlusBackdropOverlay';

import './LumoPlusUpsellModal.scss';

interface Feature {
    icon: IconName;
    getText: () => string;
}

const features: Feature[] = [
    {
        icon: 'globe',
        getText: () => c('collider_2025: Feature').t`Web search`,
    },
    {
        icon: 'speech-bubble',
        getText: () => c('collider_2025: Feature').t`Unlimited weekly chats`,
    },
    {
        icon: 'clock-rotate-left',
        getText: () => c('collider_2025: Feature').t`Unlimited chat history`,
    },
    {
        icon: 'star',
        getText: () => c('collider_2025: Feature').t`Unlimited favourite chats`,
    },
    {
        icon: 'arrow-up-line',
        getText: () => c('collider_2025: Feature').t`Large file uploads`,
    },
    {
        icon: 'chip',
        getText: () => c('collider_2025: Feature').t`Advanced models`,
    },
];

interface Props {
    modalProps: ModalStateProps;
    upsellRef?: string;
    specialBackdrop?: boolean;
}

// TODO: Add the logic to refresh after subscription is completed

const LumoPlusUpsellModal = ({ modalProps, upsellRef, specialBackdrop = false }: Props) => {
    // const [openSubscriptionModal] = useSubscriptionModal();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const { APP_NAME } = useConfig();
    const [showModal, setShowModal] = useState(!specialBackdrop);

    const handleBackdropAnimationComplete = () => {
        setShowModal(true);
    };

    const lumoPlusModalUpsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: LUMO_UPSELL_PATHS.LUMO_PLUS_UPGRADE_MODAL,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: APP_NAME,
    });
    const upgradeUrl = addUpsellPath(LUMO_PLUS_FREE_PATH_TO_ACCOUNT, lumoPlusModalUpsellRef);

    if (plansMapLoading) {
        return <Loader />;
    }

    const lumoPlan = plansMap[PLANS.LUMO];

    if (!lumoPlan) {
        return <Loader />;
    }
    const monthlyAmount = (lumoPlan.Pricing[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;

    const price = (
        <Price currency={lumoPlan.Currency} suffix={c('Suffix').t`/month`} key="monthlyAmount">
            {monthlyAmount}
        </Price>
    );

    return (
        <>
            {specialBackdrop && (
                <LumoPlusBackdropOverlay show={modalProps.open} onAnimationComplete={handleBackdropAnimationComplete} />
            )}
            {showModal && (
                <ModalTwo
                    className={`modal-two--twocolors modal-two--upsell-lumoplus ${specialBackdrop ? 'modal-two--no-backdrop lumo-modal-animated' : ''}`}
                    {...modalProps}
                    // onClose={handleClose}
                >
                    <div className="modal-two--upsell-lumoplus-gradient">
                        <ModalTwoHeader />
                        <div className="modal-two-illustration-container mb-2 relative text-center">
                            <img src={lumoCatLoaf} alt="" />
                        </div>
                    </div>
                    <div className="modal-two-content-container overflow-auto">
                        <ModalTwoContent className="my-8 mx-8">
                            <div className="mb-4">
                                <img src={lumoPlusLogo} alt="lumo+" style={{ height: '24px' }} />
                            </div>
                            <p className="mt-2 mb-6 text-wrap-balance color-weak">{c('collider_2025: Description')
                                .t`Elevate your private AI experience and unlock advanced models and premium features with ${LUMO_SHORT_APP_NAME} Plus.`}</p>

                            <div className="mb-6">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3 py-3">
                                        <Icon className="color-primary shrink-0" name={feature.icon} size={4} />
                                        <span>{feature.getText()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 mb-6 text-center">
                                <ButtonLike
                                    as={SettingsLink}
                                    path={upgradeUrl}
                                    size="large"
                                    color="norm"
                                    shape="solid"
                                    fullWidth
                                    className="lumo-payment-trigger" //do not remove, being used by lumo mobile
                                >
                                    {c('collider_2025: Action').jt`Get ${LUMO_SHORT_APP_NAME} Plus from only ${price}`}
                                </ButtonLike>
                            </div>
                        </ModalTwoContent>
                    </div>
                </ModalTwo>
            )}
        </>
    );
};

export default LumoPlusUpsellModal;
