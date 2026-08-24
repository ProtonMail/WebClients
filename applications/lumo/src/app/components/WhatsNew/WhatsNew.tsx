import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useModalStateObject } from '@proton/components';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useStaggeredWhatsNewFeatures } from '../../hooks/useStaggeredWhatsNewFeatures';
import { useLumoSelector } from '../../redux/hooks';
import { selectMasterKeyState } from '../../redux/selectors';
import { useNativeComposerVisibilityApi } from '../Composer/hooks/useNativeComposerVisibilityApi';
import WhatsNewModal from './WhatsNewModal';
import { getLumo2WhatsNewStages } from './stages';
import type { WhatsNewFeature } from './types';

import './WhatsNew.scss';

const WhatsNew = () => {
    const { whatsNew } = useLumoFlags();
    const masterKeyState = useLumoSelector(selectMasterKeyState);
    const lumoUserSettingsBootstrapped = useLumoSelector((state) => state.initialization.lumoUserSettingsBootstrapped);
    const isWhatsNewReady = masterKeyState.status === 'ready' && lumoUserSettingsBootstrapped;

    const features: WhatsNewFeature[] = useMemo(
        () => [
            {
                id: 'lumo-2',
                versionFlag: 'WhatsNewV2',
                stages: getLumo2WhatsNewStages(),
                onAction: () => {},
                canShow: true,
            },
        ],
        []
    );

    const { currentFeature, dismissFeature, declineFeature } = useStaggeredWhatsNewFeatures(
        features,
        whatsNew && isWhatsNewReady
    );
    const timerRef = useRef<number>();
    const isMountedRef = useRef(false);
    const previousFeatureIdRef = useRef<string | null>(null);
    const currentFeatureRef = useRef(currentFeature);
    currentFeatureRef.current = currentFeature;
    const declineFeatureRef = useRef(declineFeature);
    declineFeatureRef.current = declineFeature;

    const dismissCurrentFeature = useCallback(() => {
        if (currentFeature) {
            dismissFeature(currentFeature.id, currentFeature.versionFlag);
        }
    }, [currentFeature, dismissFeature]);

    const handleModalClose = useCallback(() => {
        const feature = currentFeatureRef.current;
        if (feature) {
            declineFeatureRef.current(feature.id, feature.versionFlag);
        }
    }, []);

    const whatsNewModalProps = useModalStateObject({ onClose: handleModalClose });
    const { modalProps, openModal, render } = whatsNewModalProps;
    const openModalRef = useRef(openModal);
    openModalRef.current = openModal;
    const modalOpenRef = useRef(modalProps.open);
    modalOpenRef.current = modalProps.open;

    useNativeComposerVisibilityApi({
        hideComposer: render && modalProps.open,
    });

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const currentFeatureId = currentFeature?.id ?? null;
        const hadFeature = previousFeatureIdRef.current !== null;
        previousFeatureIdRef.current = currentFeatureId;

        if (!currentFeature) {
            if (hadFeature && modalOpenRef.current) {
                openModalRef.current(false);
            }
            return;
        }

        timerRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
                openModalRef.current(true);
            }
        }, 500);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [currentFeature?.id]);

    if (!currentFeature) {
        return null;
    }

    return (
        <>
            {render && (
                <WhatsNewModal
                    key={currentFeature.id}
                    feature={currentFeature}
                    onCallToAction={() => {
                        currentFeature.onAction();
                        dismissCurrentFeature();
                        openModal(false);
                    }}
                    onCancel={modalProps.onClose}
                    {...modalProps}
                />
            )}
        </>
    );
};

export default WhatsNew;
