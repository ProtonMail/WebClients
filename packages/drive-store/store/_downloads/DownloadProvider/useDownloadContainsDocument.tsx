import { useRef } from 'react';

import { c } from 'ttag';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { useDownloadContainsDocumentsModal } from '../../../components/modals/DownloadContainsDocumentsModal';
import { waitUntil } from '../../../utils/async';
import type { Download, UpdateFilter } from './interface';

export default function useDownloadContainsDocument(cancelDownloads: (filter: UpdateFilter) => void) {
    const [containsDocumentModal, showModal] = useDownloadContainsDocumentsModal();
    const modalResult = useRef<Map<string, boolean>>(new Map());

    const handleContainsDocument = (abortSignal: AbortSignal, download: Download): Promise<boolean> => {
        const cancel = (reject: (e: Error) => void) => {
            cancelDownloads(download.id);

            reject(new TransferCancel({ message: c('Info').t`Download was canceled` }));
        };

        const result = modalResult.current.get(download.id);

        if (result === undefined) {
            showModal({
                onSubmit: () => {
                    modalResult.current.set(download.id, true);
                },
                onCancel: () => {
                    modalResult.current.set(download.id, false);
                },
            });
        }

        return new Promise((resolve, reject) => {
            waitUntil(() => modalResult.current.has(download.id), abortSignal)
                .then(() => {
                    if (modalResult.current.get(download.id) === false) {
                        cancel(reject);
                        return;
                    }
                    resolve(true);
                })
                .catch(() => {
                    cancel(reject);
                });
        });
    };

    return {
        handleContainsDocument,
        containsDocumentModal,
    };
}
