import type { ReactNode } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { MainLogo, usePopperAnchor } from '@proton/components';
import Toolbar from '@proton/components/components/toolbar/Toolbar';
import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { UploadCreateDropdown } from '../../statelessComponents/UploadCreateDropdown/UploadCreateDropdown';
import { CopyLinkButton } from '../commonButtons/CopyLinkButton';
import { DetailsButton } from '../commonButtons/DetailsButton';
import { BookmarkButton } from './BookmarkButton';
import { CreateAccountButton } from './CreateAccountButton';
import { DownloadDropdown } from './DownloadDropdown';
import { GoBackButton } from './GoBackButton';
import { UserInfo } from './UserInfo';
import { usePublicAuthStore } from './usePublicAuth.store';

import './PublicHeader.scss';

export interface PublicHeaderProps {
    breadcrumbOrName: ReactNode;
    sharedBy: string | undefined;
    onDownload: () => void;
    onScanAndDownload: () => void;
    onDetails?: () => void;
    onCopyLink: () => void;
    onUploadFile?: () => void;
    onUploadFolder?: () => void;
    onCreateFolder?: () => void;
    onCreateDocument?: () => Promise<void>;
    onCreateSpreadsheet?: () => Promise<void>;
    nbSelected?: number;
    isEmptyView?: boolean;
    customPassword?: string;
    isPartialView?: boolean;
}

export const PublicHeader = ({
    breadcrumbOrName,
    sharedBy,
    onDownload,
    onScanAndDownload,
    onDetails,
    onCopyLink,
    onUploadFile,
    onUploadFolder,
    onCreateFolder,
    onCreateDocument,
    onCreateSpreadsheet,
    nbSelected,
    isEmptyView = false,
    customPassword,
    isPartialView = false,
}: PublicHeaderProps) => {
    const userAddress = usePublicAuthStore(useShallow((state) => state.getUserMainAddress()));
    const showUploadActions = onUploadFile && onUploadFolder && onCreateFolder;
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [isCreatingNativeProtonDocs, withIsCreatingNativeProtonDocs] = useLoading(false);
    const { viewportWidth } = useActiveBreakpoint();
    const isMobile = viewportWidth['<=small'];
    const isDesktop = viewportWidth['>=xlarge'];

    return (
        <>
            {isPartialView && <GoBackButton />}
            <div className="flex justify-space-between">
                {isDesktop ? (
                    <div className="flex-column flex mx-0 my-4">
                        <div className="flex items-center gap-1 text-4xl text-bold">
                            <MainLogo className="flex items-center" to="/" reloadDocument variant="glyph-only" />
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
                ) : (
                    <div className="flex flex-nowrap ml-2 mr-4 mb-1.5 w-full">
                        <MainLogo
                            className="flex items-center px-2 pt-1.5 min-w-custom w-auto"
                            to="/"
                            reloadDocument
                            variant="glyph-only"
                            style={{
                                '--min-w-custom': '2.25rem',
                            }}
                        />
                        <div className="flex flex-column text-lg">
                            {breadcrumbOrName}
                            {sharedBy && (
                                <span className="text-sm pl-1.5 color-weak text-ellipsis max-w-full">{c('Subtitle')
                                    .t`Shared by ${sharedBy}`}</span>
                            )}
                        </div>
                    </div>
                )}
                <i
                    className="md:hidden w-full h-custom bg-weak"
                    style={{
                        '--h-custom': '0.25rem',
                    }}
                />
                <div className="public-header-toolbar fixed md:relative bottom-0 left-0 bg-norm px-4 py-4 flex gap-2 justify-space-between md:justify-start items-center w-full md:w-auto">
                    <>
                        <Toolbar className="h-auto toolbar--heavy toolbar--in-container">
                            {!isPartialView && (
                                <>
                                    <CopyLinkButton buttonType="toolbar" onClick={onCopyLink} />
                                    {showUploadActions && (
                                        <>
                                            <ToolbarButton
                                                icon={<IcPlus size={4} />}
                                                ref={anchorRef}
                                                onClick={toggle}
                                                title={c('Action').t`Create`}
                                                loading={isCreatingNativeProtonDocs}
                                                data-testid="toolbar-upload-create"
                                            />
                                            <UploadCreateDropdown
                                                onUploadFile={onUploadFile}
                                                onUploadFolder={onUploadFolder}
                                                onCreateFolder={onCreateFolder}
                                                onCreateDocument={() =>
                                                    withIsCreatingNativeProtonDocs(onCreateDocument)
                                                }
                                                onCreateSpreadsheet={() =>
                                                    withIsCreatingNativeProtonDocs(onCreateSpreadsheet)
                                                }
                                                anchorRef={anchorRef}
                                                isOpen={isOpen}
                                                onClose={close}
                                            />
                                        </>
                                    )}
                                    {onDetails && !isMobile && (
                                        <DetailsButton buttonType="toolbar" onClick={onDetails} />
                                    )}
                                </>
                            )}
                            <DownloadDropdown
                                onDownload={onDownload}
                                onScanAndDownload={onScanAndDownload}
                                nbSelected={nbSelected}
                                disabled={isEmptyView}
                            />
                        </Toolbar>
                        {!isPartialView && (
                            <>
                                {!isMobile && (
                                    <>
                                        <Vr className="h-custom" style={{ '--h-custom': '2.25rem' }} />
                                        <BookmarkButton customPassword={customPassword} />
                                    </>
                                )}
                                {userAddress ? (
                                    <UserInfo userAddress={userAddress} />
                                ) : (
                                    <CreateAccountButton isMobile={isMobile} />
                                )}
                            </>
                        )}
                    </>
                </div>
            </div>
        </>
    );
};
