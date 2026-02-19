import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';
import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';
import {useLumoFlags} from '../../../hooks/useLumoFlags';

import { useLumoNavigate } from '../../../hooks/useLumoNavigate';
import { useStaggeredWhatsNewFeatures } from '../../../hooks/useStaggeredWhatsNewFeatures';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import WhatsNewModal from './WhatsNewModal';
import type { WhatsNewFeature } from './types';

import './WhatsNew.scss';

const WhatsNew = () => {
    const { whatsNew} = useLumoFlags();
    const { isDarkLumoTheme, isAutoMode } = useLumoTheme();
    const navigate = useLumoNavigate();

    const features: WhatsNewFeature[] = useMemo(
        () => [

            {
                id: 'projects',
                versionFlag: 'WhatsNewV1p3',
                image: lumoProjects,
                getTitle: () => c('collider_2025:Title').t`Introducing Projects`,
                onAction: () => {
                    navigate('/projects');
                },
                getFeaturePoints: () => [
                    {
                        icon: 'lock',
                        svg: (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="color-norm shrink-0"
                            >
                                <g clipPath="url(#clip0_16758_9935)">
                                    <path
                                        d="M4.66699 4H11.3337M4.66699 6H11.3337M6 11.3335H10M1.99967 8.00016H1.73301C1.51209 8.00016 1.33301 8.17923 1.33301 8.40016V14.2668C1.33301 14.4878 1.51209 14.6668 1.73301 14.6668H14.2663C14.4873 14.6668 14.6663 14.4878 14.6663 14.2668V8.40016C14.6663 8.17923 14.4873 8.00016 14.2663 8.00016H13.9997M1.99967 8.00016V1.7335C1.99967 1.51258 2.17876 1.3335 2.39967 1.3335H13.5997C13.8206 1.3335 13.9997 1.51258 13.9997 1.7335V8.00016M1.99967 8.00016H13.9997"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_16758_9935">
                                        <rect width="16" height="16" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                        ),
                        getText: () =>
                            c('collider_2025:FeaturePoint')
                                .t`Chats, files, and context stay together in an encrypted workspace.`,
                    },
                    {
                        icon: 'arrow-up-and-left-big',
                        svg: (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="color-norm shrink-0"
                            >
                                <path
                                    d="M8 14.0001C4.68629 14.0001 2 12.8061 2 11.3334C2 9.86068 4.68629 8.66675 8 8.66675C11.3137 8.66675 14 9.86068 14 11.3334C14 12.8061 11.3137 14.0001 8 14.0001Z"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8 1.33325C9.1046 1.33325 10 2.22869 10 3.33325V3.99992H6V3.33325C6 2.22869 6.8954 1.33325 8 1.33325Z"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M2.33301 10.3334L4.99967 5.66675"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M13.6667 10.3334L11 5.66675"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ),
                        getText: () =>
                            c('collider_2025:FeaturePoint')
                                .t`Project-specific instructions mean no repeating yourself.`,
                    },
                    {
                        icon: 'pen-sparks',
                        svg: (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="color-norm shrink-0"
                            >
                                <g clipPath="url(#clip0_16758_9945)">
                                    <path
                                        d="M10.1881 11.932C10.839 11.8272 11.4504 11.6045 11.9999 11.2866L14.3999 11.7335L13.953 9.3335C14.4068 8.54903 14.6665 7.63823 14.6665 6.66683C14.6665 3.72131 12.2787 1.3335 9.33321 1.3335C6.64829 1.3335 4.42676 3.31748 4.05469 5.89939M4.99967 14.6668C7.02474 14.6668 8.66634 13.0252 8.66634 11.0002C8.66634 8.9751 7.02474 7.3335 4.99967 7.3335C2.97463 7.3335 1.33301 8.9751 1.33301 11.0002C1.33301 11.668 1.51156 12.2942 1.82354 12.8335L1.51634 14.4835L3.16634 14.1763C3.70566 14.4883 4.33181 14.6668 4.99967 14.6668Z"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_16758_9945">
                                        <rect width="16" height="16" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                        ),
                        getText: () =>
                            c('collider_2025:FeaturePoint')
                                .t`Tailored responses based on your project’s files and instructions.`,
                    },
                ],
                canShow: true,
            },
        ],
        [isDarkLumoTheme, isAutoMode]
    );

    const { currentFeature, dismissFeature, declineFeature } = useStaggeredWhatsNewFeatures(features, whatsNew);
    const timerRef = useRef<number>();

    const dismissCurrentFeature = () => {
        if (currentFeature) {
            dismissFeature(currentFeature.id, currentFeature.versionFlag);
        }
    };

    const declineCurrentFeature = () => {
        if (currentFeature) {
            declineFeature(currentFeature.id, currentFeature.versionFlag);
        }
    };

    // const handleOpenSettingsModal = () => {
    //     settingsModalProps.openModal(true);
    // };

    // const handleCloseSettingsModal = () => {
    //     whatsNewModalProps.openModal(false);
    //     dismissCurrentFeature();
    // };

    const whatsNewModalProps = useModalStateObject({ onClose: declineCurrentFeature });
    // const settingsModalProps = useModalStateObject({ onClose: handleCloseSettingsModal });

    useEffect(() => {
        if (currentFeature) {
            timerRef.current = window.setTimeout(() => {
                whatsNewModalProps.openModal(true);
            }, 500);
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
                    onCallToAction={() => {
                        currentFeature.onAction();
                        dismissCurrentFeature();
                    }}
                    onCancel={whatsNewModalProps.modalProps.onClose}
                    {...whatsNewModalProps.modalProps}
                />
            )}
            {/* {settingsModalProps.render && (
                <SettingsModal initialPanel={currentFeature.settingsPanelToOpen} {...settingsModalProps.modalProps} />
            )} */}
        </>
    );
};

export default WhatsNew;
