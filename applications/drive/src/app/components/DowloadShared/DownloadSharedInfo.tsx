import React, { ReactNode } from 'react';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { Icon, FileNameDisplay, Button } from '@proton/components';

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
                <span className="ml0-25 text-no-wrap">{expirationDate}</span>
            </>
        ),
        content: (
            <div className="flex flex-column w13e">
                <Button size="large" color="norm" className="ml2 mr2" onClick={onDownload}>
                    {c('Action').t`Download`}
                </Button>
            </div>
        ),
    };

    if (download) {
        if (download.state === TransferState.Done) {
            contents.title = c('Title').t`Download completed`;
            contents.info = c('Info').t`Your file has finished downloading.`;
            contents.content = <Icon name="check-circle" size={100} className="fill-primary" />;
        } else if (download.state === TransferState.Error) {
            contents.title = c('Title').t`Download failed`;
            contents.info = c('Info').t`Your file failed to download.`;
            contents.content = <Icon name="attention-circle" size={100} className="fill-primary" />;
        } else if (download.state === TransferState.Canceled) {
            contents.title = c('Title').t`Download canceled`;
            contents.info = c('Info').t`Your download has been canceled.`;
            contents.content = <Icon name="off" size={100} className="fill-primary" />;
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
            <h3 className="text-bold mt2 mb0-25">{contents.title}</h3>
            <p className="m0">{contents.info}</p>
            <div className="flex flex-column flex-nowrap flex-align-items-center flex-justify-center mt2 mb2 pt1 pb1 w100">
                {contents.content}
            </div>
            <div className="text-bold mb0-5 mw100 flex w100 text-center">
                <FileNameDisplay text={name} className="center" />
            </div>
            <SizeCell size={size} />
        </>
    );
};

export default DownloadSharedInfo;
