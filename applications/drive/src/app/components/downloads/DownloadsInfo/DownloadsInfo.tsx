import * as React from 'react';
import { useDownloadProvider, DownloadState } from '../DownloadProvider';
import { c, msgid } from 'ttag';

function DownloadsInfo() {
    const { downloads } = useDownloadProvider();

    const activeCount = downloads.filter(({ state }) => state !== DownloadState.Done).length;

    return (
        <>
            {activeCount > 0 && (
                <div className="pd-downloads bg-global-altgrey color-white strong pt0-5 pb0-5 pl1 pr1">
                    {c('Info').ngettext(
                        msgid`Downloading ${activeCount} file`,
                        `Downloading ${activeCount} files`,
                        activeCount
                    )}
                </div>
            )}
        </>
    );
}

export default DownloadsInfo;
