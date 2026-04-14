import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcCross } from '@proton/icons/icons/IcCross';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import lumoDrive from '@proton/styles/assets/img/lumo/lumo-drive.svg';

import { GuestSignInState } from './GuestSignInState/GuestSignInState';

interface KnowledgeBaseGuestDriveUpsellProps {
    filesContainerRef: React.RefObject<HTMLDivElement>;
    isModal: boolean;
    isMediumScreen: boolean;
    onBack?: () => void;
    onClose: () => void;
}

export const KnowledgeBaseGuestDriveUpsell = ({
    filesContainerRef,
    isModal,
    isMediumScreen,
    onBack,
    onClose,
}: KnowledgeBaseGuestDriveUpsellProps) => {
    const outerClass = isModal
        ? 'files-panel h-full w-full modal-files-panel'
        : `files-panel h-full ${isMediumScreen ? 'w-1/2' : 'w-1/3'} pt-2 pr-4 pb-6 bg-weak`;

    const innerClass = isModal
        ? 'w-full h-full rounded-none shadow-none overflow-hidden'
        : 'w-full h-full p-4 rounded-xl bg-norm shadow-lifted overflow-hidden';

    return (
        <div className={outerClass} ref={filesContainerRef}>
            <div className={innerClass}>
                <div className="h-full bg-norm flex flex-column flex-nowrap">
                    <div className="flex flex-row flex-nowrap items-center justify-space-between mb-2">
                        <div className="flex flex-row items-center gap-1">
                            {onBack && (
                                <Button onClick={onBack} size="small" shape="ghost">
                                    <IcArrowLeft size={4} />
                                </Button>
                            )}
                            <p className="m-0 text-lg text-bold">{DRIVE_APP_NAME}</p>
                        </div>
                        <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                            <IcCross />
                        </Button>
                    </div>
                    <GuestSignInState
                        image={lumoDrive}
                        title={c('collider_2025: Info').t`Access ${DRIVE_APP_NAME}`}
                        description={c('collider_2025: Info')
                            .t`Sign in or create an account to browse and add files from your ${DRIVE_APP_NAME} (end-to-end encrypted cloud storage) to your chat knowledge.`}
                    />
                </div>
            </div>
        </div>
    );
};
