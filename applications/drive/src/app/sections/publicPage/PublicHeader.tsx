import type { ReactNode } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { usePopperAnchor } from '@proton/components';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import Toolbar from '@proton/components/components/toolbar/Toolbar';
import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';

import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { UploadCreateDropdown } from '../../statelessComponents/UploadCreateDropdown/UploadCreateDropdown';
import { CopyLinkButton } from '../commonButtons/CopyLinkButton';
import { DetailsButton } from '../commonButtons/DetailsButton';
import { BookmarkButton } from './BookmarkButton';
import { CreateAccountButton } from './CreateAccountButton';
import { GoBackButton } from './GoBackButton';
import { UserInfo } from './UserInfo';
import { usePublicAuthStore } from './usePublicAuth.store';

export interface PublicHeaderProps {
    breadcrumbOrName: ReactNode;
    sharedBy: string | undefined;
    onDownload: () => Promise<void>;
    onDetails?: () => void;
    onCopyLink: () => void;
    onUploadFile?: () => void;
    onUploadFolder?: () => void;
    onCreateFolder?: () => void;
    nbSelected?: number;
    isEmptyView?: boolean;
    customPassword?: string;
    isPartialView?: boolean;
}

export const PublicHeader = ({
    breadcrumbOrName,
    sharedBy,
    onDownload,
    onDetails,
    onCopyLink,
    onUploadFile,
    onUploadFolder,
    onCreateFolder,
    nbSelected,
    isEmptyView = false,
    customPassword,
    isPartialView = false,
}: PublicHeaderProps) => {
    const downloadCopy =
        nbSelected && nbSelected > 1 ? c('Action').t`Download (${nbSelected})` : c('Action').t`Download`;
    const userAddress = usePublicAuthStore(useShallow((state) => state.getUserMainAddress()));
    const showUploadActions = onUploadFile && onUploadFolder && onCreateFolder;
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            {isPartialView && <GoBackButton />}
            <div className="flex justify-space-between my-4">
                <div className="flex flex-column">
                    <div className="flex items-center gap-1">
                        <DriveLogo to="/" variant="glyph-only" />
                        {breadcrumbOrName}
                    </div>

                    {sharedBy && (
                        <span className="flex gap-1 ml-11 pl-0.5 color-weak">
                            {c('Subtitle').t`Shared by ${sharedBy}`}
                            <span className="text-norm mx-1">&#x2022;</span>
                            {c('Info').t`End-to-end encrypted`}
                        </span>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    {!isPartialView && (
                        <>
                            <Toolbar className="h-auto toolbar--heavy toolbar--in-container">
                                <CopyLinkButton buttonType="toolbar" onClick={onCopyLink} />
                                {showUploadActions && (
                                    <>
                                        <ToolbarButton
                                            icon={<IcPlus size={4} />}
                                            ref={anchorRef}
                                            onClick={toggle}
                                            title={c('Action').t`Create`}
                                        />
                                        <UploadCreateDropdown
                                            onUploadFile={onUploadFile}
                                            onUploadFolder={onUploadFolder}
                                            onCreateFolder={onCreateFolder}
                                            anchorRef={anchorRef}
                                            isOpen={isOpen}
                                            onClose={close}
                                        />
                                    </>
                                )}
                                {onDetails && <DetailsButton buttonType="toolbar" onClick={onDetails} />}
                                <ToolbarButton onClick={onDownload} disabled={isEmptyView}>
                                    <IcArrowDownLine className="mr-2" size={4} />
                                    {downloadCopy}
                                </ToolbarButton>
                            </Toolbar>
                            <Vr className="h-custom" style={{ '--h-custom': '2.25rem' }} />
                            <BookmarkButton customPassword={customPassword} />
                            {userAddress ? <UserInfo userAddress={userAddress} /> : <CreateAccountButton />}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
