import { useActiveBreakpoint } from '@proton/components/hooks';

import type { useBookmarksPublicView } from '../../../store';
import { useDownload, useDownloadScanFlag } from '../../../store';
import { SaveToDriveButton } from '../Bookmarks/SaveToDriveButton';
import type { DownloadButtonProps } from './DownloadButton';
import { DownloadButton } from './DownloadButton';
import ReportAbuseButton from './ReportAbuseButton';

interface Props extends DownloadButtonProps {
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    hideSaveToDrive?: boolean;
}
const SharedPageFooter = ({ rootItem, items, bookmarksPublicView, hideSaveToDrive = false }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const { hasDownloads } = useDownload();
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { isLoading, addBookmark, isAlreadyBookmarked, urlPassword, isLoggedIn } = bookmarksPublicView;

    if (viewportWidth['<=small']) {
        // Hide download button if transfer modal is present
        if (hasDownloads) {
            return null;
        }
        return (
            <div className="fixed bottom-0 p-4 flex flex-wrap justify-center bg-weak w-full gap-4">
                <DownloadButton
                    rootItem={rootItem}
                    items={items}
                    isScanAndDownload={isDownloadScanEnabled}
                    color="weak"
                />
                {!hideSaveToDrive && (
                    <SaveToDriveButton
                        loading={isLoading}
                        onClick={addBookmark}
                        alreadyBookmarked={isAlreadyBookmarked}
                        urlPassword={urlPassword}
                        isLoggedIn={isLoggedIn}
                    />
                )}
            </div>
        );
    }
    return <ReportAbuseButton className="ml-1 mb-4 fixed left-0 bottom-0" linkInfo={rootItem} />;
};

export default SharedPageFooter;
