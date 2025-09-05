import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalStateObject,
} from '@proton/components';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoWhatsNewMobile from '@proton/styles/assets/img/lumo/lumo-whats-new-mobile.svg';
import lumoWhatsNew from '@proton/styles/assets/img/lumo/lumo-whats-new.svg';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useOnboardingContext } from '../../../providers/OnboardingProvider';

import './WhatsNew.scss';

const WhatsNew = () => {
    const { isOnboardingCompleted } = useOnboardingContext();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const {
        show,
        onDisplayed,
        onClose: onSpotlightClose,
    } = useSpotlightOnFeature(FeatureCode.LumoWhatsNewCard, isOnboardingCompleted);
    const whatsNewModalProps = useModalStateObject({ onClose: onSpotlightClose });

    const onClickModal = () => {
        whatsNewModalProps.modalProps.onClose();
    };

    useEffect(() => {
        if (show) {
            if (isSmallScreen) {
                whatsNewModalProps.openModal(true);
            }
            onDisplayed();
        }
    }, [show, isSmallScreen]);

    if (!show) {
        return null;
    }

    if (isSmallScreen) {
        return (
            <ModalTwo className="whats-new-modal" fullscreenOnMobile {...whatsNewModalProps.modalProps}>
                <ModalTwoHeader title={c('collider_2025:Title').t`What's new`} />
                <ModalTwoContent>
                    <div className="flex flex-column flex-nowrap gap-4">
                        <img src={lumoWhatsNewMobile} alt="" className="shrink-0" />
                        <div className="flex flex-column flex-nowrap gap-2 items-center mt-4">
                            <h2 className="text-semibold color-primary">{c('collider_2025:Title')
                                .t`Introducing ${LUMO_SHORT_APP_NAME} 1.1`}</h2>
                            <p className="m-0 color-weak text-lg text-center px-4">{c('collider_2025:Title')
                                .t`${LUMO_SHORT_APP_NAME} 1.1 is much smarter, more capable, with improved awareness of recent events, ready to give you more thorough and useful answers.`}</p>
                        </div>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button size="large" color="norm" onClick={onClickModal}>{c('collider_2025: Button')
                        .t`Try it now`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    return (
        <div className="whats-new-section hidden md:flex flex-column flex-nowrap gap-2 mt-6 bg-norm p-4 pt-4 mx-8">
            <div className="flex flex-row flex-nowrap justify-space-between items-center">
                <h2 className="text-rg text-semibold">{c('collider_2025:Title').t`What's new`}</h2>
                <Button size="small" icon shape="ghost" onClick={onSpotlightClose}>
                    <Icon name="cross" size={5} alt={c('collider_2025: Action').t`Dismiss`} />
                </Button>
            </div>
            <div className="flex flex-row flex-nowrap gap-6 mx-4 p-2">
                <img src={lumoWhatsNew} alt="" className="shrink-0" />
                <div className="flex flex-column flex-nowrap gap-2">
                    <h2 className="text-rg text-semibold">{c('collider_2025:Title')
                        .t`Introducing ${LUMO_SHORT_APP_NAME} 1.1`}</h2>
                    <p className="m-0 color-weak">{c('collider_2025:Title')
                        .t`${LUMO_SHORT_APP_NAME} 1.1 is much smarter, more capable, with improved awareness of recent events, ready to give you more thorough and useful answers.`}</p>
                </div>
            </div>
        </div>
    );
};

export default WhatsNew;
