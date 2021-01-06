import React, { ReactNode } from 'react';
import { c } from 'ttag';

import { dateLocale } from 'proton-shared/lib/i18n';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { Icon, LargeButton } from 'react-components';

import DownloadProgressBar from './DownloadProgressBar';
import SizeCell from '../FileBrowser/ListView/Cells/SizeCell';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { TransferState } from '../../interfaces/transfer';
import useStatsHistory from '../../hooks/drive/useStatsHistory';

interface Props {
    name: string;
    size: number;
    expirationTime: number | null;
    downloadFile: () => Promise<void>;
}

const DownloadSharedInfo = ({ name, size, expirationTime, downloadFile }: Props) => {
    const { downloads, getDownloadsProgresses } = useDownloadProvider();
    const statsHistory = useStatsHistory(downloads, getDownloadsProgresses);

    const expirationDate = expirationTime
        ? readableTime(expirationTime, 'PP', { locale: dateLocale })
        : c('Label').t`Never`;
    const onDownload = () => {
        downloadFile().catch(console.error);
    };

    const download = downloads[0];
    const latestStats = statsHistory[0];

    const contents: { title: string; info: ReactNode; content: ReactNode } = {
        title: c('Title').t`Your file is ready to be downloaded`,
        info: (
            <>
                {c('Info').t`Link expires: `}
                <span className="ml0-25 no-wrap">{expirationDate}</span>
            </>
        ),
        content: (
            <div className="flex flex-column w200p">
                <LargeButton className="pm-button--primary ml2 mr2" onClick={onDownload}>
                    {c('Action').t`Download`}
                </LargeButton>
            </div>
        ),
    };

    if (download) {
        if (download.state === TransferState.Done) {
            contents.title = c('Title').t`Download completed`;
            contents.info = c('Info').t`Your file has finished downloading.`;
            contents.content = <Icon name="check-circle" size={100} className="color-primary" />;
        } else {
            contents.title = c('Title').t`Downloading`;
            contents.info = c('Info').t`Your file is being downloaded.`;
            contents.content = (
                <div className="w100">
                    <DownloadProgressBar latestStats={latestStats} download={download} />
                </div>
            );
        }
    }

    return (
        <>
            <h3 className="bold mt2 mb0-25">{contents.title}</h3>
            <p className="m0">{contents.info}</p>
            <div
                style={{ height: '7em' }}
                className="flex flex-column flex-nowrap flex-items-center flex-justify-center mt1 mb1 w100"
            >
                {contents.content}
            </div>
            <div style={{ maxHeight: '6em' }} title={name} className="bold mb0-5 scroll-if-needed w100">
                {name}
            </div>
            <SizeCell size={size} />
        </>
    );
};

export default DownloadSharedInfo;
