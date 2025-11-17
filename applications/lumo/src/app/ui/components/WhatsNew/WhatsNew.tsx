import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import whatsNewDarkMode from '../../../components/Animations/whats-new-dark-mode.json';
import whatsNewPersonalization from '../../../components/Animations/whats-new-personalization.json';
import { useStaggeredWhatsNewFeatures } from '../../../hooks/useStaggeredWhatsNewFeatures';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import { useLumoSelector } from '../../../redux/hooks';
import { selectHasModifiedPersonalization } from '../../../redux/slices/personalization';
import SettingsModal from '../SettingsModal/SettingsModal';
import WhatsNewModal from './WhatsNewModal';

import './WhatsNew.scss';

const WHATS_NEW_FEATURE_FLAG = 'WhatsNewV1p2' as const;

export type WhatsNewFeature = {
    id: string;
    versionFlag: string;
    image: any;
    getTitle: () => string;
    getDescription: () => string;
    settingsPanelToOpen?: string;
    canShow: boolean;
};

const WhatsNew = () => {
    const isFeatureEnabled = useFlag(WHATS_NEW_FEATURE_FLAG);
    const hasModifiedPersonalization = useLumoSelector((state) => selectHasModifiedPersonalization(state));
    const { isDarkLumoTheme, isAutoMode } = useLumoTheme();

    const features: WhatsNewFeature[] = useMemo(
        () => [
            {
                id: 'darkMode',
                versionFlag: 'WhatsNewV1p2',
                image: whatsNewDarkMode,
                getTitle: () => c('collider_2025:Title').t`Dark mode is here`,
                getDescription: () =>
                    c('collider_2025:Title')
                        .t`Dark mode has been one of our community’s most highly anticipated updates for ${LUMO_SHORT_APP_NAME}. Throughout the ${BRAND_NAME} ecosystem, you can customize the look of all of your apps, and now you can customize ${LUMO_SHORT_APP_NAME}, too, with a light or dark theme.`,
                settingsPanelToOpen: 'general',
                canShow: !isDarkLumoTheme && !isAutoMode,
            },
            {
                id: 'personalization',
                versionFlag: 'WhatsNewV1p2',
                image: whatsNewPersonalization,
                getTitle: () => c('collider_2025:Title').t`Personalization: ${LUMO_SHORT_APP_NAME} for you`,
                getDescription: () =>
                    c('collider_2025:Title')
                        .t`Personalization lets you tailor how ${LUMO_SHORT_APP_NAME} interacts with you. Tell ${LUMO_SHORT_APP_NAME} your name, what you do, and exactly how you want it to respond, witty banter, technical precision, or straight-to-the-point brevity. Because the best AI isn't one-size-fits-all. It's one that feels like it was built just for you.`,
                settingsPanelToOpen: 'personalization',
                canShow: !hasModifiedPersonalization,
            },
        ],
        [hasModifiedPersonalization, isDarkLumoTheme, isAutoMode]
    );

    const { currentFeature, dismissFeature } = useStaggeredWhatsNewFeatures(features, isFeatureEnabled);
    const timerRef = useRef<number>();

    const handleClose = () => {
        if (currentFeature) {
            dismissFeature(currentFeature.id, currentFeature.versionFlag);
        }
    };

    const handleOpenSettingsModal = () => {
        settingsModalProps.openModal(true);
    };

    const handleCloseSettingsModal = () => {
        whatsNewModalProps.openModal(false);
        handleClose();
    };

    const whatsNewModalProps = useModalStateObject({ onClose: handleClose });
    const settingsModalProps = useModalStateObject({ onClose: handleCloseSettingsModal });

    useEffect(() => {
        if (currentFeature) {
            timerRef.current = window.setTimeout(() => {
                whatsNewModalProps.openModal(true);
            }, 1500);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [currentFeature]);

    if (!currentFeature) {
        return null;
    }

    return (
        <>
            {whatsNewModalProps.render && (
                <WhatsNewModal
                    key={currentFeature.id}
                    feature={currentFeature}
                    onCallToAction={handleOpenSettingsModal}
                    onCancel={whatsNewModalProps.modalProps.onClose}
                    {...whatsNewModalProps.modalProps}
                />
            )}
            {settingsModalProps.render && (
                <SettingsModal initialPanel={currentFeature.settingsPanelToOpen} {...settingsModalProps.modalProps} />
            )}
        </>
    );
};

export default WhatsNew;
