import { useEffect, useMemo, useRef } from 'react';

import { useModalStateObject } from '@proton/components';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useStaggeredWhatsNewFeatures } from '../../hooks/useStaggeredWhatsNewFeatures';
import { useNativeComposerVisibilityApi } from '../Composer/hooks/useNativeComposerVisibilityApi';
import WhatsNewModal from './WhatsNewModal';
import { getLumo2WhatsNewStages } from './stages';
import type { WhatsNewFeature } from './types';

import './WhatsNew.scss';

const WhatsNew = () => {
    const { whatsNew } = useLumoFlags();

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

    const { currentFeature, dismissFeature, declineFeature } = useStaggeredWhatsNewFeatures(features, whatsNew);
    const timerRef = useRef<number>();
    const isMountedRef = useRef(false);

    const declineCurrentFeature = () => {
        if (currentFeature) {
            declineFeature(currentFeature.id, currentFeature.versionFlag);
        }
    };

    const dismissCurrentFeature = () => {
        if (currentFeature) {
            dismissFeature(currentFeature.id, currentFeature.versionFlag);
        }
    };

    const whatsNewModalProps = useModalStateObject({ onClose: declineCurrentFeature });
    const { modalProps, openModal, render } = whatsNewModalProps;

    useNativeComposerVisibilityApi({
        showNewModal: render && modalProps.open,
    });

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (currentFeature) {
            timerRef.current = window.setTimeout(() => {
                if (isMountedRef.current) {
                    openModal(true);
                }
            }, 500);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [currentFeature, openModal]);

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
