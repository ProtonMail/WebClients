import { type FC, type PropsWithChildren, createContext, useCallback, useMemo } from 'react';
import { useStore } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FileProgressModal } from '@proton/pass/components/FileAttachments/FileProgressModal';
import { setUnsafeExportContext } from '@proton/pass/hooks/auth/useReauthActionHandler';
import { useFileExporter } from '@proton/pass/hooks/files/useFileExporter';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { ExportOptions } from '@proton/pass/lib/export/types';
import { selectUserStorageUsed } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { FileItemExport, MaybeNull } from '@proton/pass/types';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import noop from '@proton/utils/noop';

const SIZE_ALLOWED_TO_EXPORT = 100 * sizeUnits.MB;

export interface ExportContextValue {
    export: (options: ExportOptions) => Promise<File>;
}

const ExportContext = createContext<MaybeNull<ExportContextValue>>(null);
export const useExporter = createUseContext(ExportContext);

type FileExportModalState = { title: string; message: MaybeNull<string>; canExport: boolean };
const useFileExportModal = useAsyncModalHandles<void, FileExportModalState>;
const getInitialModalState = (): FileExportModalState => ({ title: '', message: '', canExport: false });

export const ExportProvider: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const store = useStore<State>();

    const fileExportPrompt = useFileExportModal({ getInitialModalState });

    /** NOTE: check this is super stable if no export is going on (+ memo) */
    const { downloadFiles, downloadedChunks, totalChunks } = useFileExporter();

    const progress = useMemo(
        () => (totalChunks ? Math.round(parseFloat(((downloadedChunks / totalChunks) * 100).toFixed(2))) : 0),
        [downloadedChunks, totalChunks]
    );

    const doDownload = useCallback(async (): Promise<MaybeNull<FileItemExport>> => {
        const usedStorage = selectUserStorageUsed(store.getState());
        const shouldDownloadFromDesktop = usedStorage > SIZE_ALLOWED_TO_EXPORT;
        const maxAllowedSizeToExport = humanSize({ bytes: SIZE_ALLOWED_TO_EXPORT, fraction: 0 });

        // Prevent downloading huge files in web or extension (extension is not allowed yet)
        if ((EXTENSION_BUILD && usedStorage) || (!DESKTOP_BUILD && shouldDownloadFromDesktop)) {
            await fileExportPrompt.handler({
                title: EXTENSION_BUILD ? c('Info').t`Can't export files` : c('Info').t`Exceeded files size`,
                message: (() => {
                    if (EXTENSION_BUILD) {
                        return shouldDownloadFromDesktop
                            ? c('Info')
                                  .t`Some items have attached files, and exporting from the extension is not yet supported. The export will continue without the attached files. To include them, please use the Desktop App.`
                            : c('Info')
                                  .t`Some items have attached files, and exporting from the extension is not yet supported. The export will continue without the attached files. To include them, please use the Web App.`;
                    }

                    return c('Info')
                        .t`The maximum file size for exporting items is ${maxAllowedSizeToExport}. The export will continue without the attached files. To include them, please use the Desktop App.`;
                })(),
                canExport: false,
                onSubmit: noop,
            });

            return null;
        }

        void fileExportPrompt.handler({
            title: c('Info').t`Downloading files`,
            message: null,
            canExport: true,
            onSubmit: noop,
        });

        const filesToDownload = await downloadFiles();
        fileExportPrompt.resolver();
        return filesToDownload;
    }, []);

    const ctx = useMemo<ExportContextValue>(
        () =>
            setUnsafeExportContext({
                export: async (options) => {
                    const files = await doDownload();
                    return core.exportData(options, files);
                },
            }),
        []
    );

    return (
        <ExportContext.Provider value={ctx}>
            {children}

            {fileExportPrompt.state.open && (
                <FileProgressModal
                    title={fileExportPrompt.state.title}
                    progress={progress}
                    message={
                        fileExportPrompt.state.canExport
                            ? !totalChunks && c('Info').t`Please be patient while your files are being downloaded.`
                            : fileExportPrompt.state.message
                    }
                    action={
                        fileExportPrompt.state.canExport ? (
                            <Button onClick={fileExportPrompt.abort} shape="outline" color="norm" pill>
                                {c('Action').t`Cancel`}
                            </Button>
                        ) : (
                            <Button onClick={fileExportPrompt.abort} color="norm" pill>
                                {c('Action').t`Confirm`}
                            </Button>
                        )
                    }
                />
            )}
        </ExportContext.Provider>
    );
};
