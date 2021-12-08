import { ReactNode, useState, useCallback, SyntheticEvent } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import dragdropImageSvg from '@proton/styles/assets/img/placeholders/drag-and-drop.svg';

import { useUpload } from '../../../store';
import { UploadFileList } from '../../../store/uploads/interface';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { isTransferCancelError } from '../../../utils/transfer';

interface UploadDragDropProps {
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

const UploadDragDrop = ({ children, className, disabled }: UploadDragDropProps) => {
    const { createNotification } = useNotifications();
    const { activeFolder } = useActiveShare();
    const { uploadFiles } = useUpload();

    const [overlayIsVisible, setOverlayIsVisible] = useState(false);

    const overlayEnabled = !disabled;

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!e.dataTransfer.types.includes('Files')) {
                return;
            }

            if (overlayIsVisible !== overlayEnabled) {
                setOverlayIsVisible(overlayEnabled);
            }
        },
        [overlayEnabled, overlayIsVisible]
    );

    const handleDragLeave = useCallback(() => {
        setOverlayIsVisible(false);
    }, [overlayIsVisible]);

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setOverlayIsVisible(false);
            const { items } = e.dataTransfer;

            if (!items) {
                return;
            }

            const filesToUpload: UploadFileList = [];

            const traverseDirectories = async (item: any, path: string[] = []) => {
                if (item.isFile) {
                    return new Promise<void>((resolve, reject) => {
                        item.file(
                            (file: File) => {
                                filesToUpload.push({ path, file });
                                resolve();
                            },
                            (error: Error) => {
                                createNotification({
                                    type: 'warning',
                                    // translator: here is an example of full sentence: File ".abc" cannot be uploaded due to "browser specific error such as hidden files are not allowed" error
                                    text: c('Error').t`File "${item.name}" cannot be uploaded due to "${error}" error`,
                                });
                                reject(new Error(`Unable to get File ${item}: ${error}`));
                            }
                        );
                    });
                }
                if (item.isDirectory) {
                    const reader = item.createReader();

                    const modificationTime = await new Promise<Date | undefined>((resolve, reject) => {
                        item.getMetadata(resolve, reject);
                    })
                        .then((metadata: any) => {
                            return metadata.modificationTime;
                        })
                        .catch(() => {
                            // For example, Firefox does not support `getMetadata`
                            // and there is no other way to get modification time
                            // at this moment.
                            return undefined;
                        });
                    filesToUpload.push({
                        path,
                        folder: item.name,
                        modificationTime,
                    });

                    // Iterates over folders recursively and puts them into filesToUpload list
                    const getEntries = async () => {
                        const promises: Promise<any>[] = [];

                        // Folders are read in batch, need to wait
                        await new Promise<PromiseSettledResult<any>[] | void>((resolve, reject) => {
                            reader.readEntries(
                                (entries: any[]) => {
                                    if (entries.length) {
                                        entries.forEach((entry) =>
                                            promises.push(traverseDirectories(entry, [...path, item.name]))
                                        );
                                        resolve(getEntries());
                                    } else {
                                        resolve();
                                    }
                                },
                                (error: Error) => reject(new Error(`Unable to traverse directory ${item}: ${error}`))
                            );
                        });

                        return Promise.allSettled(promises);
                    };
                    await getEntries();
                }
            };

            const promises: Promise<any>[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = (items[i] as any).getAsEntry
                    ? (items[i] as any).getAsEntry()
                    : items[i].webkitGetAsEntry();

                if (item) {
                    promises.push(traverseDirectories(item));
                }
            }

            // Need to wait for all files to have been read
            const results = await Promise.allSettled(promises);
            const errors = results.reduce((err, result) => {
                if (result.status === 'rejected') {
                    err.push(result.reason);
                }
                return err;
            }, [] as string[]);

            if (errors.length) {
                console.error(errors);
            }

            uploadFiles(activeFolder.shareId, activeFolder.linkId, filesToUpload).catch((err) => {
                if (!isTransferCancelError(err)) {
                    console.error(err);
                }
            });
        },
        [overlayIsVisible]
    );

    const preventDefaultEvent = useCallback((e: SyntheticEvent) => e.preventDefault(), []);

    return (
        <div
            className={className}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDrop={preventDefaultEvent}
        >
            <img className="visibility-hidden absolute h0 w0" src={dragdropImageSvg} alt="" aria-hidden="true" />
            {children}
            {overlayEnabled && overlayIsVisible && (
                <div
                    className="upload-drag-drop"
                    onDragLeave={handleDragLeave}
                    onDragOver={preventDefaultEvent}
                    onDrop={handleDrop}
                >
                    <section className="upload-drag-drop-infobox p4 pt3">
                        <img className="upload-drag-drop-image" src={dragdropImageSvg} alt="" aria-hidden="true" />
                        <h2 className="text-bold mt1 mb0">{c('Title').t`Drop to upload`}</h2>
                        <p className="mt1 mb0">{c('Info').t`Your files will be encrypted and then saved.`}</p>
                    </section>
                </div>
            )}
        </div>
    );
};

export default UploadDragDrop;
