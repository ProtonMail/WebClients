import { useActiveBreakpoint } from '@proton/components/hooks';

import { DownloadButton, DownloadButtonProps } from './DownloadButton';
import ReportAbuseButton from './ReportAbuseButton';

interface Props extends DownloadButtonProps {}
const SharedPageFooter = ({ rootItem, items }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    if (isNarrow && items.length > 0) {
        return (
            <div className="fixed bottom p-4 flex flex-justify-center bg-weak w-full">
                <DownloadButton className="flex-item flex-item-fluid" rootItem={rootItem} items={items} />
            </div>
        );
    }
    return <ReportAbuseButton className="ml-1 mb-4 fixed left bottom" linkInfo={rootItem} />;
};

export default SharedPageFooter;
