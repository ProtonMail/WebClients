import { ReactNode, useEffect, useState } from 'react';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { Icon, FileNameDisplay, Button, FileIcon } from '@proton/components';
import { TransferStatePublic } from '@proton/shared/lib/interfaces/drive/sharing';

import DownloadProgressBar from './DownloadProgressBar';
import SizeCell from '../FileBrowser/ListView/Cells/SizeCell';

interface Props {
    name: string;
    size: number | null;
    MIMEType: string;
    expirationTime: number | null;
    downloadThumbnail: Promise<string | null>;
    downloadFile: () => Promise<void>;
    progress: number;
    transferState: TransferStatePublic | undefined;
}

const getFileI18nDict = () => ({
    windowTitle: c('Title').t`Your file is ready to be downloaded`,
    transferTitleProgress: c('Title').t`Downloading`,
    transferInfoProgress: c('Info').t`Your file is being downloaded.`,
    transferTitleDone: c('Title').t`Download completed`,
    transferInfoDone: c('Info').t`Your file has finished downloading.`,
    transferTitleError: c('Title').t`Download failed`,
    transferInfoError: c('Info').t`Your file failed to download.`,
    transferTitleCancelled: c('Title').t`Download canceled`,
    transferInfoCancelled: c('Info').t`Your download has been canceled.`,
});

const getFolderI18nDict = () => ({
    windowTitle: c('Title').t`Your folder is ready to be downloaded`,
    transferTitleProgress: c('Title').t`Downloading`,
    transferInfoProgress: c('Info').t`Your folder is being downloaded.`,
    transferTitleDone: c('Title').t`Download completed`,
    transferInfoDone: c('Info').t`Your folder has finished downloading.`,
    transferTitleError: c('Title').t`Download failed`,
    transferInfoError: c('Info').t`Your folder failed to download.`,
    transferTitleCancelled: c('Title').t`Download canceled`,
    transferInfoCancelled: c('Info').t`Your download has been canceled.`,
});

const getI18nDict = (isFile: boolean) => {
    return isFile ? getFileI18nDict() : getFolderI18nDict();
};

const DownloadSharedInfo = ({
    name,
    size,
    MIMEType,
    expirationTime,
    downloadFile,
    downloadThumbnail,
    progress,
    transferState,
}: Props) => {
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    const expirationDate = expirationTime ? readableTime(expirationTime, 'PP', { locale: dateLocale }) : null;
    const onDownload = () => {
        downloadFile().catch(console.error);
    };

    useEffect(() => {
        downloadThumbnail.then(setThumbnail).catch(console.warn);
    }, [downloadThumbnail]);

    const i18nDict = getI18nDict(MIMEType !== 'Folder');

    const contents: { title: string; info: ReactNode; content: ReactNode } = {
        title: i18nDict.windowTitle,
        info: expirationDate ? (
            <>
                {c('Info').t`Link expires: `}
                <span className="ml0-25 text-no-wrap">{expirationDate}</span>
            </>
        ) : null,
        content: (
            <div className="flex flex-column w100">
                <Button size="large" color="norm" onClick={onDownload}>
                    {c('Action').t`Download`}
                </Button>
            </div>
        ),
    };

    if (transferState) {
        switch (transferState) {
            case TransferStatePublic.Progress:
                contents.title = i18nDict.transferTitleProgress;
                contents.info = i18nDict.transferInfoProgress;
                contents.content = (
                    <div className="w100">
                        <DownloadProgressBar value={progress} status={TransferStatePublic.Progress} />
                    </div>
                );
                break;
            case TransferStatePublic.Done:
                contents.title = i18nDict.transferTitleDone;
                contents.info = i18nDict.transferInfoDone;
                contents.content = <Icon name="circle-check" size={100} className="fill-primary" />;
                break;
            case TransferStatePublic.Error:
                contents.title = i18nDict.transferTitleError;
                contents.info = i18nDict.transferInfoError;
                contents.content = <Icon name="circle-exclamation" size={100} className="fill-primary" />;
                break;
            case TransferStatePublic.Canceled:
                contents.title = i18nDict.transferTitleCancelled;
                contents.info = i18nDict.transferInfoCancelled;
                contents.content = <Icon name="xmark" size={100} className="fill-primary" />;
                break;
            default:
                // This should be prevented by type check and is not supposed to happen
                throw new Error('Unexpected transfer state recieved');
        }
    }

    return (
        <>
            <h3 className="text-bold mt0- mb1">{contents.title}</h3>
            <div className="border rounded p2 w100">
                <div className="mb1">
                    {thumbnail === null ? (
                        <FileIcon size={56} mimeType={MIMEType} alt={name} className="mr0-5" />
                    ) : (
                        <img src={thumbnail} className="download-shared-info--preview-image" alt={name} />
                    )}
                </div>
                <div className="text-bold mb mw100 flex text-center">
                    <FileNameDisplay text={name} className="center" />
                </div>
                {size && <SizeCell size={size} className="color-weak" />}
                <p className="m0 color-weak">{contents.info}</p>
                <div className="flex flex-column flex-nowrap flex-align-items-center flex-justify-center mt2 w100">
                    {contents.content}
                </div>
            </div>
        </>
    );
};

export default DownloadSharedInfo;
