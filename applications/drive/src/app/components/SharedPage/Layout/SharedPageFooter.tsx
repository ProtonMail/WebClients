import clsx from '@proton/utils/clsx';

import type { useBookmarksPublicView } from '../../../store';
import { useDownload, useDownloadScanFlag } from '../../../store';
import { SaveToDriveButton } from '../Bookmarks/SaveToDriveButton';
import type { DownloadButtonProps } from './DownloadButton';
import { DownloadButton } from './DownloadButton';

interface Props extends DownloadButtonProps {
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    partialView?: boolean;
    hideSaveToDrive?: boolean;
}
const SharedPageFooter = ({ rootItem, items, bookmarksPublicView, hideSaveToDrive, partialView }: Props) => {
    const { hasDownloads } = useDownload();
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { isLoading, addBookmark, isAlreadyBookmarked, customPassword } = bookmarksPublicView;

    return (
        <div
            className={clsx(
                !hideSaveToDrive && !partialView && 'bottom-0 p-4 flex flex-wrap justify-center bg-weak w-full gap-4'
            )}
        >
            {/* // Hide download button if transfer modal is present */}
            {!!items.length && !hasDownloads && (
                <DownloadButton
                    rootItem={rootItem}
                    items={items}
                    isScanAndDownload={isDownloadScanEnabled}
                    color="weak"
                />
            )}
            {!hideSaveToDrive && !partialView && (
                <SaveToDriveButton
                    loading={isLoading}
                    onClick={addBookmark}
                    alreadyBookmarked={isAlreadyBookmarked}
                    customPassword={customPassword}
                />
            )}
        </div>
    );
};

export default SharedPageFooter;
