import { useActiveBreakpoint } from '@proton/components/hooks';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import type { useBookmarksPublicView } from '../../../store';
import { useDownloadScanFlag } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import { SaveToDriveButton } from '../Bookmarks/SaveToDriveButton';
import { ClosePartialPublicViewButton } from './ClosePartialPublicViewButton';
import type { DownloadButtonProps } from './DownloadButton';
import { DownloadButton } from './DownloadButton';

interface Props extends DownloadButtonProps {
    children: React.ReactNode;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    className?: string;
    hideSaveToDrive?: boolean;
    partialView?: boolean;
}

export default function SharedPageHeader({
    children,
    rootItem,
    items,
    bookmarksPublicView,
    className,
    hideSaveToDrive,
    partialView,
}: Props) {
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { viewportWidth } = useActiveBreakpoint();
    const selectionControls = useSelection();
    const { isLoggedIn, isAlreadyBookmarked, addBookmark, isLoading } = bookmarksPublicView;

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);

    const hasOnlyDocuments =
        (items.length > 0 && items.every((item) => item.isFile && isProtonDocument(item.mimeType))) ||
        (selectedItems.length > 0 && selectedItems.every((item) => item.isFile && isProtonDocument(item.mimeType)));

    return (
        <div className={clsx('flex flex-nowrap shrink-0 justify-space-between items-center', className)}>
            <div className="flex flex-nowrap flex-1 items-center mb-0 pb-0 mr-4 shared-page-layout-header">
                {children}
            </div>
            {viewportWidth['<=small'] || items.length === 0 ? null : (
                <>
                    <DownloadButton
                        className="ml-4"
                        rootItem={rootItem}
                        items={items}
                        isScanAndDownload={isDownloadScanEnabled}
                        disabled={hasOnlyDocuments}
                        partialView={partialView}
                    />
                    {partialView && <ClosePartialPublicViewButton className="ml-5" />}
                    {!hideSaveToDrive && !partialView && (
                        <SaveToDriveButton
                            loading={isLoading}
                            onClick={addBookmark}
                            alreadyBookmarked={isAlreadyBookmarked}
                            isLoggedIn={isLoggedIn}
                            className="ml-4"
                        />
                    )}
                </>
            )}
        </div>
    );
}
