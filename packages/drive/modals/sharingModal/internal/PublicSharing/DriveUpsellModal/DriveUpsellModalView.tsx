import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import UpsellFeatureList from '@proton/components/components/upsell/UpsellFeatureList';

import './DriveUpsellModal.scss';

export interface DriveUpsellModalViewProps {
    ['data-testid']?: string;
    titleModal: ReactNode;
    description: ReactNode;
    upgradeButton: ReactNode;
    footerTextModal: ReactNode;
    illustration: string;
    size?: ModalSize;
    closeButtonColor?: 'white' | 'black';
    isFree: boolean;
    open: boolean;
    onClose: () => void;
    onExit?: () => void;
}

export const DriveUpsellModalView = ({
    'data-testid': dataTestid,
    titleModal,
    description,
    upgradeButton,
    footerTextModal,
    illustration,
    size,
    closeButtonColor,
    isFree,
    open,
    onClose,
    onExit,
}: DriveUpsellModalViewProps) => {
    return (
        <ModalTwo
            className="modal-two--drive-upsell"
            data-testid={`drive-upsell:${dataTestid}`}
            onClose={onClose}
            onExit={onExit}
            size={size}
            open={open}
        >
            <ModalTwoHeader closeButtonProps={closeButtonColor ? { style: { color: closeButtonColor } } : undefined} />
            <div className="modal-two-illustration-container relative text-center">
                <img className="w-full" src={illustration} alt="" />
            </div>
            <div className="modal-two-content-container">
                <ModalTwoContent className="mt-8 mb-4 text-center">
                    <h1 className="text-lg text-bold">{titleModal}</h1>
                    {typeof description === 'string' ? (
                        <p className="mt-2 mb-6 color-weak">{description}</p>
                    ) : (
                        <div className="mt-2 mb-6">{description}</div>
                    )}
                    <p className="text-left text-semibold mt-0 mb-2">{c('List title').t`Also included:`}</p>
                    <UpsellFeatureList
                        className="text-left mb-4"
                        hideInfo
                        features={[
                            isFree ? 'drive-plus-storage' : '1-tb-secure-storage',
                            'file-sharing',
                            'docs-editor',
                            'photos-backup',
                            'more-premium-features',
                        ]}
                    />
                    <div>{upgradeButton}</div>
                    <p className="mt-2 text-sm color-weak">{footerTextModal}</p>
                </ModalTwoContent>
            </div>
        </ModalTwo>
    );
};
