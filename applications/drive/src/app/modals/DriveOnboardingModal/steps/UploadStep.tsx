import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';
import { IcLockOpenCheckFilled } from '@proton/icons/icons/IcLockOpenCheckFilled';
import clsx from '@proton/utils/clsx';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useFileDrop } from '../../../hooks/drive/useFileDrop';
import { useFileUploadInput, useFolderUploadInput } from '../../../store/_uploads/useUploadInput';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { Container } from '../Container';
import type { OnboardingProps } from '../interface';

import './UploadStep.scss';

export const UploadStep = ({ onNext }: OnboardingProps) => {
    const { activeFolder } = useActiveShare();
    const { handleDrop } = useFileDrop({
        shareId: activeFolder.shareId,
        parentLinkId: activeFolder.linkId,
        volumeId: activeFolder.volumeId,
        onFileUpload: () => countActionWithTelemetry(Actions.OnboardingV2UploadFile),
        onFolderUpload: () => countActionWithTelemetry(Actions.OnboardingV2UploadFolder),
    });

    const [isDragged, setIsDragged] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        setIsDragged(true);
    };

    const handleDragLeave = () => {
        setIsDragged(false);
    };

    return (
        <Container
            title={c('Onboarding Info').t`Upload your first file`}
            subtitle={c('Onboarding Info').t`Secure your files`}
            rightContent={
                <div
                    className={clsx([
                        'drag-drop-zone',
                        isDragged && 'bg-weak',
                        'relative ratio-square w-full p-4',
                        'rounded-xl border border-dashed border-strong',
                        'flex flex-column gap-4 justify-center items-center',
                    ])}
                    onDragExit={handleDragLeave}
                    onDragLeave={handleDragLeave}
                    onDragEnter={handleDragOver}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                        void handleDrop(e);
                        setIsDragged(false);
                        onNext();
                    }}
                >
                    <IcArrowUpLine size={6} />
                    <span className="text-lg">{c('Onboarding Info').t`Drag and drop your files here`}</span>

                    <div className="absolute bottom-0 mb-8 color-weak">
                        <IcLockOpenCheckFilled className="mr-2" />
                        <span>{c('Info').t`End-to-end encrypted`}</span>
                    </div>
                </div>
            }
        >
            <p>
                {c('Onboarding Info')
                    .t`Protect your financial documents, ID cards, project files, photos, and more with end-to-end encryption.`}
            </p>
        </Container>
    );
};

export const UploadStepButtons = ({ onNext }: OnboardingProps) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const {
        inputRef: folderInput,
        handleClick: folderClick,
        handleChange: folderChange,
    } = useFolderUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);

    return (
        <div className="w-full flex justify-space-between">
            <input
                multiple
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={(e) => {
                    void countActionWithTelemetry(Actions.OnboardingV2UploadFile);
                    void fileChange(e);
                    onNext();
                }}
            />
            <input
                type="file"
                ref={folderInput}
                className="hidden"
                onChange={(e) => {
                    void countActionWithTelemetry(Actions.OnboardingV2UploadFolder);
                    void folderChange(e);
                    onNext();
                }}
            />

            <Button
                size="large"
                shape="ghost"
                color="norm"
                onClick={() => {
                    void countActionWithTelemetry(Actions.OnboardingV2UploadSkip);
                    onNext();
                }}
            >
                {c('Onboarding Action').t`Skip for now`}
            </Button>

            <div className="flex gap-2">
                <Button
                    className="flex items-center justify-center gap-2"
                    size="large"
                    color="norm"
                    onClick={folderClick}
                >
                    <IcFolderArrowUp />
                    <span>{c('Onboarding Action').t`Upload folder`}</span>
                </Button>
                <Button
                    className="flex items-center justify-center gap-2"
                    size="large"
                    color="norm"
                    onClick={fileClick}
                >
                    <IcFileArrowInUp />
                    <span>{c('Onboarding Action').t`Upload file`}</span>
                </Button>
            </div>
        </div>
    );
};
