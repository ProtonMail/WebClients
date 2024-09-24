import { useActiveBreakpoint } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import type { useBookmarksPublicView } from '../../../store';
import { useDownload, useDownloadScanFlag } from '../../../store';
import { SaveToDriveButton } from '../Bookmarks/SaveToDriveButton';
import type { DownloadButtonProps } from './DownloadButton';
import { DownloadButton } from './DownloadButton';
import ReportAbuseButton from './ReportAbuseButton';

interface Props extends DownloadButtonProps {
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    partialView?: boolean;
    hideSaveToDrive?: boolean;
}
const SharedPageFooter = ({ rootItem, items, bookmarksPublicView, hideSaveToDrive, partialView }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const { hasDownloads } = useDownload();
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { isLoading, addBookmark, isAlreadyBookmarked, customPassword } = bookmarksPublicView;

    if (viewportWidth['<=small']) {
        return (
            <div
                className={clsx(
                    !hideSaveToDrive &&
                        !partialView &&
                        'fixed bottom-0 p-4 flex flex-wrap justify-center bg-weak w-full gap-4'
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
    }
    return <ReportAbuseButton className="ml-1 mb-4 fixed left-0 bottom-0" linkInfo={rootItem} />;
};

export default SharedPageFooter;
