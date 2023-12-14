import { useActiveBreakpoint } from '@proton/components/hooks';

import { useDownload } from '../../../store';
import { DownloadButton, DownloadButtonProps } from './DownloadButton';
import ReportAbuseButton from './ReportAbuseButton';

interface Props extends DownloadButtonProps {}
const SharedPageFooter = ({ rootItem, items }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const { hasDownloads } = useDownload();

    if (viewportWidth['<=small']) {
        // Hide download button if transfer modal is present
        if (hasDownloads) {
            return null;
        }
        return (
            <div className="fixed bottom-0 p-4 flex justify-center bg-weak w-full">
                <DownloadButton className="flex-1" rootItem={rootItem} items={items} />
            </div>
        );
    }
    return <ReportAbuseButton className="ml-1 mb-4 fixed left-0 bottom-0" linkInfo={rootItem} />;
};

export default SharedPageFooter;
