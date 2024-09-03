import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import generateUID from '@proton/atoms/generateUID';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import type { TransferMeta } from '../../../components/TransferManager/transfer';
import { TransferState } from '../../../components/TransferManager/transfer';
import { isTransferFinished, isTransferPending } from '../../../utils/transfer';
import type { LinkDownload } from '../interface';
import type {
    Download,
    UpdateCallback,
    UpdateCallbackParams,
    UpdateData,
    UpdateFilter,
    UpdateState,
} from './interface';
import { DownloadUserError } from './interface';

type LogCallback = (id: string, message: string) => void;

export default function useDownloadQueue(log: LogCallback) {
    const [downloads, setDownloads] = useState<Download[]>([]);

    const hasDownloads = useMemo((): boolean => {
        return downloads.length > 0;
    }, [downloads]);

    const nextDownload = useMemo(() => {
        return downloads.find((download) => isTransferPending(download));
    }, [downloads]);

    const add = useCallback(async (links: LinkDownload[], options?: { virusScan?: boolean }): Promise<void> => {
        return new Promise((resolve, reject) => {
            setDownloads((downloads) => {
                if (isAlreadyDownloading(downloads, links)) {
                    reject(new DownloadUserError(generateAlreadyDownloadingError(links)));
                    return downloads;
                }
                const download = generateDownload(links, options);
                log(
                    download.id,
                    `Added item to the queue (type: ${download.meta.mimeType}, size: ${download.meta.size} bytes)`
                );
                resolve();
                return [...downloads, download];
            });
        });
    }, []);

    const update = useCallback(
        (
            idOrFilter: UpdateFilter,
            newStateOrCallback: UpdateState,
            { size, error, signatureIssueLink, signatureStatus, scanIssueError }: UpdateData = {},
            callback?: UpdateCallback
        ) => {
            const filter = convertFilterToFunction(idOrFilter);
            const newStateCallback = convertNewStateToFunction(newStateOrCallback);
            const updateDownload = (download: Download): Download => {
                if (filter(download)) {
                    callback?.(download);
                    const newState = newStateCallback(download);
                    // If pause is set twice, prefer resumeState set already before
                    // to not be locked in paused state forever.
                    download.resumeState =
                        newState === TransferState.Paused ? download.resumeState || download.state : undefined;
                    download.state = newState;
                    if (size !== undefined) {
                        download.meta.size = size;
                    }
                    download.error = error;
                    download.signatureIssueLink = signatureIssueLink;
                    download.signatureStatus = signatureStatus;
                    download.scanIssueError = scanIssueError;
                    log(
                        download.id,
                        `Updated queue (state: ${newState} ${size !== undefined ? `, size: ${size}` : ''} ${error ? `, error: ${error}` : ''})`
                    );
                }
                return download;
            };
            setDownloads((downloads) => [...downloads.map(updateDownload)]);
        },
        []
    );

    const updateState = useCallback(
        (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState) => {
            update(idOrFilter, newStateOrCallback);
        },
        [update]
    );

    const updateWithData = useCallback(
        (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState, data: UpdateData = {}) => {
            update(idOrFilter, newStateOrCallback, data);
        },
        [update]
    );

    const updateWithCallback = useCallback(
        (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState, callback: UpdateCallback) => {
            update(idOrFilter, newStateOrCallback, {}, callback);
        },
        [update]
    );

    const remove = useCallback((idOrFilter: UpdateFilter, callback?: UpdateCallback) => {
        const filter = convertFilterToFunction(idOrFilter);
        const invertFilter: UpdateFilter = (item) => !filter(item);

        setDownloads((downloads) => {
            if (callback) {
                downloads.filter(filter).forEach((download) => callback(download));
            }
            return [...downloads.filter(invertFilter)];
        });
    }, []);

    const clear = useCallback(() => {
        setDownloads([]);
    }, []);

    return {
        downloads,
        hasDownloads,
        nextDownload,
        add,
        updateState,
        updateWithData,
        updateWithCallback,
        remove,
        clear,
    };
}

export function convertFilterToFunction(filterOrId: UpdateFilter) {
    return typeof filterOrId === 'function' ? filterOrId : ({ id }: UpdateCallbackParams) => id === filterOrId;
}

function convertNewStateToFunction(newStateOrCallback: UpdateState) {
    return typeof newStateOrCallback === 'function' ? newStateOrCallback : () => newStateOrCallback;
}

function isAlreadyDownloading(downloads: Download[], links: LinkDownload[]): boolean {
    return downloads.some((download) => {
        // User can download the same files again after previous one was
        // already finished, either canceled, failed, or downloaded.
        if (isTransferFinished(download)) {
            return false;
        }
        if (download.links.length !== links.length) {
            return false;
        }
        const ids = download.links.map((link) => link.shareId + link.linkId);
        return links.every((link) => ids.includes(link.shareId + link.linkId));
    });
}

function generateAlreadyDownloadingError(links: LinkDownload[]): string {
    if (links.length > 1) {
        return c('Error').t`File selection is already downloading`;
    }
    const { name } = links[0];
    if (!links[0].isFile) {
        return c('Error').t`Folder "${name}" is already downloading`;
    }
    return c('Error').t`File "${name}" is already downloading`;
}

function generateDownload(links: LinkDownload[], options?: { virusScan?: boolean }): Download {
    return {
        id: generateUID(),
        startDate: new Date(),
        state: TransferState.Pending,
        links,
        meta: generateDownloadMeta(links),
        options,
    };
}

function generateDownloadMeta(links: LinkDownload[]): TransferMeta {
    if (links.length === 1) {
        const link = links[0];
        if (link.isFile) {
            return {
                filename: link.name,
                mimeType: link.mimeType,
                size: link.size,
            };
        }
        return {
            filename: `${link.name}.zip`,
            mimeType: SupportedMimeTypes.zip,
        };
    }
    return {
        filename: generateMyFilesName(),
        mimeType: SupportedMimeTypes.zip,
    };
}

function generateMyFilesName(): string {
    const date = new Date().toISOString().substring(0, 19);
    // translator: Name of the download archive when selected multiple files, example: My files 2021-10-11T12:13:14.zip.
    return c('Title').t`Download ${date}`.concat('.zip');
}
