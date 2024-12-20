import { CircleLoader } from '@proton/atoms/index';
import { FileNameDisplay } from '@proton/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import type { useBookmarksPublicView } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import { SaveToDriveButton } from '../Bookmarks/SaveToDriveButton';
import { CreateButton } from '../EditActions/CreateButton';
import { UploadButton } from '../EditActions/UploadButton';
import Breadcrumbs from './Breadcrumbs';
import { ClosePartialPublicViewButton } from './ClosePartialPublicViewButton';
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
    canWrite?: boolean;
    token?: string;
    linkId?: string;
}

export function SharedPageContentHeader({
    canWrite,
    token,
    linkId,
    name,
    size,
    rootItem,
    items,
    bookmarksPublicView,
    className,
    hideSaveToDrive,
    isPartialView,
    isFolderView,
    onNavigate,
}: Props) {
    const selectionControls = useSelection();
    const { isAlreadyBookmarked, addBookmark, isLoading, customPassword } = bookmarksPublicView;
    const readableSize = shortHumanSize(size);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);

    const hasOnlyDocuments =
        (items.length > 0 && items.every((item) => item.isFile && isProtonDocument(item.mimeType))) ||
        (selectedItems.length > 0 && selectedItems.every((item) => item.isFile && isProtonDocument(item.mimeType)));

    return (
        <div className={clsx('lg:flex lg:justify-space-between', className)}>
            <div className="flex flex-column flex-nowrap flex-1 mb-0 pb-0 mr-4 max-w-full">
                {isFolderView && linkId && token ? (
                    <Breadcrumbs
                        token={token}
                        name={name}
                        linkId={linkId}
                        onNavigate={onNavigate}
                        className="w-full shared-folder-header-breadcrumbs pb-1"
                    />
                ) : (
                    <FileNameDisplay className="text-4xl text-bold py-1 md:p-1" text={name} />
                )}
                {size !== undefined ? <span className="color-weak text-pre">{readableSize}</span> : <CircleLoader />}
            </div>
            <div className="shared-page-content-header-buttons pt-2">
                <DownloadButton rootItem={rootItem} items={items} disabled={hasOnlyDocuments || !items.length} />

                {canWrite && token && linkId && (
                    <>
                        <UploadButton token={token} linkId={linkId} />
                        <CreateButton token={token} linkId={linkId} />
                    </>
                )}
                {isPartialView && <ClosePartialPublicViewButton />}
                {!hideSaveToDrive && !isPartialView && (
                    <SaveToDriveButton
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
