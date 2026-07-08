import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { confirmActionModal as ConfirmActionModal } from '@proton/components';
import { EmptyFileDecision, uploadManager } from '@proton/drive/modules/upload';

/**
 * Registers the empty-file resolver with the upload manager and renders the
 * confirmation prompt when an empty file is detected during upload.
 */
export const EmptyFileConfirmModal = () => {
    const [emptyFileState, setEmptyFileState] = useState<{
        fileNames: string[];
        resolve: (userDecision: EmptyFileDecision) => void;
    } | null>(null);

    const resolveEmptyFile = (userDecision: EmptyFileDecision) => {
        if (emptyFileState) {
            const { resolve } = emptyFileState;
            setEmptyFileState(null);
            resolve(userDecision);
        }
    };

    useEffect(() => {
        uploadManager.setEmptyFileResolver(async (fileNames) => {
            return new Promise<EmptyFileDecision>((resolve) => {
                setEmptyFileState({ fileNames, resolve });
            });
        });

        return () => {
            uploadManager.removeEmptyFileResolver();
        };
    }, []);

    return (
        <ConfirmActionModal
            open={emptyFileState !== null}
            onClose={() => resolveEmptyFile(EmptyFileDecision.Cancel)}
            onExit={() => {}}
            // Can't be technically undone but files can be deleted to undo the upload.
            canUndo={true}
            title={c('Title').t`Upload empty file?`}
            submitText={c('Action').t`Upload anyway`}
            cancelText={c('Action').t`Skip`}
            message={(() => {
                const fileNames = emptyFileState?.fileNames ?? [];
                const count = fileNames.length;
                return (
                    <>
                        <p className="mb-1">
                            {c('Info').ngettext(
                                msgid`This file appears to be empty:`,
                                `These files appear to be empty:`,
                                count
                            )}
                        </p>
                        <ul className="unstyled mb-2">
                            {fileNames.map((name) => (
                                <li key={name} className="text-bold text-break">
                                    {name}
                                </li>
                            ))}
                        </ul>
                        <p className="mb-0">
                            {c('Info').ngettext(
                                msgid`Do you still want to upload it?`,
                                `Do you still want to upload them?`,
                                count
                            )}
                        </p>
                    </>
                );
            })()}
            onSubmit={async () => resolveEmptyFile(EmptyFileDecision.Allow)}
            onCancel={() => resolveEmptyFile(EmptyFileDecision.Skip)}
            actionType="norm"
        />
    );
};
