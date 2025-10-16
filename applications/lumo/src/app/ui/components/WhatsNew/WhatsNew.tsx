import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, useModalStateObject } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoWhatsNewMobile from '@proton/styles/assets/img/lumo/lumo-whats-new-mobile.svg';
import lumoWhatsNew from '@proton/styles/assets/img/lumo/lumo-whats-new.svg';
import useFlag from '@proton/unleash/useFlag';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useWhatsNewFeatureFlag } from '../../../hooks/useWhatsNewFeatureFlag';
import { useOnboardingContext } from '../../../providers/OnboardingProvider';
import SettingsModal from '../SettingsModal/SettingsModal';

import './WhatsNew.scss';

const WHATS_NEW_FEATURE_FLAG = 'WhatsNewV1p2' as const;
const WHATS_NEW_VERSION = '1.2';

const WhatsNew = () => {
    const isFeatureEnabled = useFlag(WHATS_NEW_FEATURE_FLAG);

    const { isOnboardingCompleted } = useOnboardingContext();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { shouldShow, markAsSeen } = useWhatsNewFeatureFlag(
        WHATS_NEW_FEATURE_FLAG,
        isFeatureEnabled && isOnboardingCompleted === true
    );
    const timerRef = useRef<number>();

    const handleClose = () => {
        markAsSeen();
    };

    const handleOpenSettingsModal = () => {
        settingsModalProps.openModal(true);
    };

    const whatsNewModalProps = useModalStateObject({ onClose: handleClose });
    const settingsModalProps = useModalStateObject({ onClose: handleClose });

    useEffect(() => {
        if (shouldShow && isSmallScreen) {
            timerRef.current = window.setTimeout(() => {
                whatsNewModalProps.openModal(true);
            }, 1500);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [shouldShow, isSmallScreen]);

    const openSettingsModalButton = (
        <InlineLinkButton onClick={handleOpenSettingsModal} key="eslint-autofix-AF30E9">{c('collider_2025: Action')
            .t`settings`}</InlineLinkButton>
    );

    if (!shouldShow) {
        return null;
    }

    if (isSmallScreen) {
        return (
            <>
                <ModalTwo className="whats-new-modal" enableCloseWhenClickOutside {...whatsNewModalProps.modalProps}>
                    <ModalTwoContent>
                        <div className="flex flex-column flex-nowrap gap-4">
                            <h2 className="text-semibold color-primary text-center mt-2">{c('collider_2025:Title')
                                .t`What's new`}</h2>
                            <img src={lumoWhatsNewMobile} alt="" className="shrink-0" />
                            <div className="flex flex-column flex-nowrap gap-2 items-center mt-2">
                                <p className="m-0 color-weak text-lg text-center px-4">{c('collider_2025:Title')
                                    .t`Introducing ${LUMO_SHORT_APP_NAME} ${WHATS_NEW_VERSION} with support for dark mode and new options to personalize your conversations.`}</p>
                            </div>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button size="large" color="norm" className="w-full" onClick={handleOpenSettingsModal}>{c(
                            'collider_2025: Button'
                        ).t`Try it now`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
                {settingsModalProps.render && (
                    <SettingsModal initialPanel="general" {...settingsModalProps.modalProps} />
                )}
            </>
        );
    }

    return (
        <>
            {settingsModalProps.render && <SettingsModal initialPanel="general" {...settingsModalProps.modalProps} />}
            <div className="whats-new-section hidden md:flex flex-column flex-nowrap mt-6 bg-norm p-4 pb-6 mx-8">
                <div className="w-full flex">
                    <span className="text-semibold">{c('collider_2025:Title').t`What's new`}</span>
                    <Button size="small" icon shape="ghost" onClick={handleClose} className="ml-auto">
                        <Icon name="cross" size={5} alt={c('collider_2025: Action').t`Dismiss`} />
                    </Button>
                </div>
                <div className="flex flex-row flex-nowrap gap-6 mx-4 p-2 pt-0">
                    <img src={lumoWhatsNew} alt="" className="shrink-0" />
                    <div className="flex flex-column flex-nowrap gap-2">
                        <h2 className="text-rg text-semibold">{c('collider_2025:Title')
                            .t`Dark mode and conversation personalization`}</h2>
                        <p className="m-0 color-weak">{c('collider_2025:Title')
                            .jt`Introducing ${LUMO_SHORT_APP_NAME} ${WHATS_NEW_VERSION} with support for dark mode and new options to personalize your conversations. Try it out in ${openSettingsModalButton}.`}</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WhatsNew;
