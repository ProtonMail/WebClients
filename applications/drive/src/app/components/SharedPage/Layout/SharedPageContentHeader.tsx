import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import type { useBookmarksPublicView } from '../../../store';
import { usePublicShareStore } from '../../../zustand/public/public-share.store';
import { useSelection } from '../../FileBrowser';
import { FileName } from '../../FileName';
import { getSelectedItems } from '../../sections/helpers';
import { SaveForLaterButton } from '../Bookmarks/SaveForLaterButton';
import DetailsButton from '../DetailsButton';
import { CreateButton } from '../EditActions/CreateButton';
import { UploadButton } from '../EditActions/UploadButton';
import Breadcrumbs from './Breadcrumbs';
import { DownloadButton, type DownloadButtonProps } from './DownloadButton';

import './SharedPageContentHeader.scss';

interface Props extends DownloadButtonProps {
    name: string;
    size?: number;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    onNavigate?: (linkId: string) => void;
    className?: string;
    hideSaveToDrive?: boolean;
    isPartialView?: boolean;
    isFolderView?: boolean;
    token: string;
    linkId: string;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean; mimeType?: string }) => void;
}

export function SharedPageContentHeader({
    token,
    linkId,
    name,
    size,
    rootLink,
    items,
    bookmarksPublicView,
    className,
    hideSaveToDrive,
    isPartialView,
    isFolderView = false,
    onNavigate,
    openInDocs,
}: Props) {
    const { viewOnly } = usePublicShareStore((state) => ({ viewOnly: state.viewOnly }));
    const selectionControls = useSelection();
    const { isAlreadyBookmarked, addBookmark, isLoading, customPassword } = bookmarksPublicView;
    const readableSize = shortHumanSize(size);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);

    const hasOnlyDocuments =
        (items.length > 0 &&
            items.every(
                (item) => item.isFile && (isProtonDocsDocument(item.mimeType) || isProtonDocsSpreadsheet(item.mimeType))
            )) ||
        (selectedItems.length > 0 &&
            selectedItems.every(
                (item) => item.isFile && (isProtonDocsDocument(item.mimeType) || isProtonDocsSpreadsheet(item.mimeType))
            ));
    const sharedBy = rootLink.signatureEmail;

    return (
        <div className={clsx('flex w-full justify-space-between gap-4', className)}>
            <div className="flex flex-column flex-nowrap mb-0 pb-0 mr-4 max-w-full">
                <div className="flex flex-nowrap items-center pb-1 gap-2">
                    {isFolderView ? (
                        <Breadcrumbs
                            token={token}
                            name={name}
                            linkId={linkId}
                            onNavigate={onNavigate}
                            className="shared-folder-header-breadcrumbs"
                        />
                    ) : (
                        <FileName className="text-4xl text-bold" text={name} />
                    )}
                    {!viewOnly && <DetailsButton className="shrink-0 " linkId={linkId} />}
                </div>
                <div className="flex items-center color-weak">
                    {rootLink.signatureEmail && (
                        // translator: Text will be like: Shared by eric.norbert@pm.me
                        <>
                            <span>{c('Info').t`Shared by ${sharedBy}`}</span>
                            <i
                                className="mx-2 w-custom h-custom rounded-full bg-strong"
                                aria-hidden="true"
                                style={{
                                    '--w-custom': '0.25rem',
                                    '--h-custom': '0.25rem',
                                }}
                            />
                        </>
                    )}
                    {size !== undefined ? <span className="text-pre">{readableSize}</span> : <CircleLoader />}
                </div>
            </div>
            <div className="shared-page-content-header-buttons">
                <DownloadButton
                    rootLink={rootLink}
                    items={items}
                    openInDocs={openInDocs}
                    // Single document selection will redirect to Docs app
                    disabled={!items.length || (hasOnlyDocuments && (!openInDocs || selectedItems.length > 1))}
                />

                {isFolderView && !viewOnly && (
                    <>
                        <UploadButton volumeId={rootLink.volumeId} token={token} linkId={linkId} />
                        <CreateButton token={token} linkId={linkId} volumeId={rootLink.volumeId} />
                    </>
                )}
                {!hideSaveToDrive && !isPartialView && (
                    <SaveForLaterButton
                        loading={isLoading}
                        onClick={addBookmark}
                        alreadyBookmarked={isAlreadyBookmarked}
                        customPassword={customPassword}
                    />
                )}
            </div>
        </div>
    );
}
