import { useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatLoaf from '@proton/styles/assets/img/lumo/lumo-cat-loaf-upsell.svg';

import { type IconName, LumoIcon } from '../components/LumoIcon/LumoIcon';
import { LumoLogoWithTierTag } from '../components/LumoLogoWithTierTag/LumoLogoWithTierTag';
import LumoPlusBackdropOverlay from './LumoPlusBackdropOverlay';

import './LumoPlusUpsellModal.scss';

interface Feature {
    icon: IconName;
    getText: () => string;
}

const features: Feature[] = [
    {
        icon: 'Globe',
        getText: () => c('collider_2025: Feature').t`Get answers with real-time web search`,
    },
    {
        icon: 'MessageSquare',
        getText: () => c('collider_2025: Feature').t`Chat as much as you need with no limits`,
    },
    {
        icon: 'History',
        getText: () => c('collider_2025: Feature').t`Access all your past conversations anytime`,
    },
    {
        icon: 'Folder',
        getText: () => c('collider_2025: Feature').t`Organize work in projects with custom instructions`,
    },
    {
        icon: 'Star',
        getText: () => c('collider_2025: Feature').t`Save unlimited conversations as favorites`,
    },
    {
        icon: 'ArrowUpFromLine',
        getText: () => c('collider_2025: Feature').t`Upload and analyze larger files`,
    },
    {
        icon: 'Cpu',
        getText: () => c('collider_2025: Feature').t`Use the most advanced AI models`,
    },
];

interface Props {
    modalProps: ModalStateProps;
    upsellRef?: string;
    specialBackdrop?: boolean;
    // subTitle?: string;
    ctaButton?: React.ReactNode;
    loading?: boolean;
    options?: {
        subTitle?: string | any[];
        illustration?: string;
    };
}

// TODO: Add the logic to refresh after subscription is completed

const LumoUpsellModal = ({ modalProps, specialBackdrop = false, ctaButton, options, loading = false }: Props) => {
    const [showModal, setShowModal] = useState(!specialBackdrop);

    const handleBackdropAnimationComplete = () => {
        setShowModal(true);
    };

    const description =
        options?.subTitle ||
        c('collider_2025: Description')
            .t`Elevate your private AI experience and unlock advanced models and premium features with ${LUMO_SHORT_APP_NAME} Plus.`;

    return (
        <>
            {specialBackdrop && (
                <LumoPlusBackdropOverlay show={modalProps.open} onAnimationComplete={handleBackdropAnimationComplete} />
            )}
            {showModal && (
                <ModalTwo
                    className={`modal-two--twocolors modal-two--upsell-lumoplus ${specialBackdrop ? 'modal-two--no-backdrop lumo-modal-animated' : ''}`}
                    {...modalProps}
                >
                    <div className="modal-two--upsell-lumoplus-gradient">
                        <ModalTwoHeader />
                        <div className="modal-two-illustration-container mb-2 relative text-center">
                            <img src={options?.illustration || lumoCatLoaf} alt="" />
                        </div>
                    </div>
                    <div className="modal-two-content-container overflow-auto">
                        <ModalTwoContent className="my-8 mx-8">
                            <div className="mb-4">
                                <LumoLogoWithTierTag tierTag="plus" height="24px" />
                            </div>
                            <p className="mt-2 mb-6 color-weak">{description}</p>

                            <div className="mb-6">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3 py-3">
                                        <LumoIcon className="color-primary shrink-0" name={feature.icon} size={16} />
                                        <span>{feature.getText()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 mb-6 text-center">
                                {loading ? <Loader size="medium" /> : ctaButton}
                            </div>
                        </ModalTwoContent>
                    </div>
                </ModalTwo>
            )}
        </>
    );
};

export default LumoUpsellModal;
