import * as React from 'react';
import { useDownloadProvider, DownloadState } from '../downloads/DownloadProvider';
import { c, msgid } from 'ttag';
import { useUploadProvider, UploadState, UploadProgresses } from '../uploads/UploadProvider';
import humanSize from 'proton-shared/lib/helpers/humanSize';

function TransfersInfo() {
    const { downloads } = useDownloadProvider();
    const { uploads, getUploadsProgresses } = useUploadProvider();

    const [progresses, setProgresses] = React.useState<UploadProgresses>({});

    React.useEffect(() => {
        const activeUploads = uploads.filter(({ state }) => state !== UploadState.Done);

        if (!activeUploads.length) {
            return;
        }

        const int = setInterval(() => {
            setProgresses(getUploadsProgresses());
        }, 500);
        return () => {
            clearInterval(int);
        };
    }, [uploads]);

    const activeDownloads = downloads.filter(({ state }) => state !== DownloadState.Done);
    const activeUploads = uploads.filter(({ state }) => state !== UploadState.Done);
    const activeCount = activeDownloads.length + activeUploads.length;

    const getHeadingText = () => {
        if (activeDownloads.length && activeUploads.length) {
            return c('Info').ngettext(
                msgid`Transfering ${activeCount} file`,
                `Transfering ${activeCount} files`,
                activeCount
            );
        } else if (!activeUploads.length) {
            return c('Info').ngettext(
                msgid`Downloading ${activeCount} file`,
                `Downloading ${activeCount} files`,
                activeCount
            );
        }
        return c('Info').ngettext(msgid`Uploading ${activeCount} file`, `Uploading ${activeCount} files`, activeCount);
    };

    const progressText = humanSize(Object.values(progresses)[0] ?? 0);
    const totalText = humanSize(uploads[0]?.info.blob.size ?? 0);

    return (
        <>
            {activeCount > 0 && (
                <div className="pd-downloads bg-global-altgrey color-white strong pt0-5 pb0-5 pl1 pr1">
                    {getHeadingText()} ({progressText} / {totalText})
                </div>
            )}
        </>
    );
}

export default TransfersInfo;
