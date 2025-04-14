import { type ComponentProps, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import type { Dropzone, FileInput } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useCurrentTabID } from '@proton/pass/components/Core/PassCoreProvider';
import { useFileImporter } from '@proton/pass/hooks/import/useFileImporter';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { useRequestDispatch } from '@proton/pass/hooks/useRequest';
import { isAbortError } from '@proton/pass/lib/api/errors';
import { ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import type { ImportProgress, ImportReport } from '@proton/pass/lib/import/helpers/report';
import { computeProgress, getImportCounts } from '@proton/pass/lib/import/helpers/report';
import { importReader } from '@proton/pass/lib/import/reader';
import type { ImportFileReader, ImportPayload } from '@proton/pass/lib/import/types';
import { ImportProvider } from '@proton/pass/lib/import/types';
import { importItems, importReport } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import { selectAliasItems, selectRequestProgress, selectUser } from '@proton/pass/store/selectors';
import type { MaybeNull, Result } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { orThrow, pipe } from '@proton/pass/utils/fp/pipe';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { wait } from '@proton/shared/lib/helpers/promise';
import identity from '@proton/utils/identity';

type DropzoneProps = ComponentProps<typeof Dropzone>;
type FileInputProps = ComponentProps<typeof FileInput>;

export type ImportFormValues = {
    file: MaybeNull<File>;
    provider: MaybeNull<ImportProvider>;
};

export type ImportFormContext = {
    busy: boolean;
    form: FormikContextType<ImportFormValues>;
    progress: MaybeNull<number>;
    dropzone: {
        hovered: boolean;
        onDrop: DropzoneProps['onDrop'];
        onAttach: FileInputProps['onChange'];
        setSupportedFileTypes: (fileTypes: string[]) => void;
    };
    cancel: () => void;
};

export type OnWillSubmitImportResult = Result<{ payload: ImportPayload }>;
export type OnPassphraseImportResult = Result<{ passphrase: string }>;

export type OnPassphraseImport = () => Promise<OnPassphraseImportResult>;
export type OnWillSubmitImport = (payload: ImportPayload) => Promise<OnWillSubmitImportResult>;

type UseImportFormOptions = {
    onPassphrase: OnPassphraseImport;
    onWillSubmit: OnWillSubmitImport;
};

export const getInitialFormValues = (): ImportFormValues => ({ file: null, provider: null });

export const createFileValidator = (allow: string[]) =>
    pipe(
        (files: File[]) => first(files)!,
        orThrow('Unsupported file type', (file) => allow.includes(splitExtension(file?.name)[1]), identity)
    );

export const validateImportForm = ({ provider, file }: ImportFormValues): FormikErrors<ImportFormValues> => {
    const errors: FormikErrors<ImportFormValues> = {};
    if (provider === null) errors.provider = c('Warning').t`No password manager selected`;
    if (!file) errors.file = '';

    return errors;
};

const isNonEmptyImportPayload = (payload: ImportPayload) =>
    payload.vaults.length > 0 && payload.vaults.some(({ items }) => items.length > 0);

export const useImportForm = ({ onPassphrase, onWillSubmit }: UseImportFormOptions): ImportFormContext => {
    const { createNotification } = useNotifications();
    const ctrl = useRef<MaybeNull<AbortController>>(null);
    const importFiles = useFileImporter();

    const tabId = useCurrentTabID();
    const requestID = importItems.requestID({ tabId });

    /** NOTE: Debounce import progress updates to prevent UI flickering.
     * When transitioning from items phase to files phase, there can be a brief
     * moment where progress appears to drop to 0% before file import begins */
    const itemProgress = useDebouncedValue(useMemoSelector(selectRequestProgress, [requestID]), 250);
    const [progress, setProgress] = useState<MaybeNull<ImportProgress>>(null);

    const [busy, setBusy] = useState(false);
    const [dropzoneHovered, setDropzoneHovered] = useState(false);
    const [supportedFileTypes, setSupportedFileTypes] = useState<string[]>([]);

    const user = useSelector(selectUser);
    const aliases = useSelector(selectAliasItems);

    const dispatch = useDispatch();
    const doImportItems = useRequestDispatch(importItems);

    const cancel = useCallback(() => {
        importFiles.cancel();
        ctrl.current?.abort();
        dispatch(requestCancel(requestID));
        setProgress(null);
    }, []);

    const onSubmit = useCallback(async (values: ImportFormValues, { setValues }: FormikHelpers<ImportFormValues>) => {
        const controller = new AbortController();
        const { signal } = controller;
        ctrl.current = controller;

        if (!values.provider) return setBusy(false);
        setBusy(true);

        let report: MaybeNull<ImportReport> = null;
        let reader: MaybeNull<ImportFileReader> = null;

        try {
            /** 1. Try to read the imported file. If files are included,
             * `result` will hold a file reader handle to extract files.
             * Import file preparation handles optional decryption. */
            const result = await importReader({
                file: values.file!,
                provider: values.provider,
                userId: user?.ID,
                options: {
                    currentAliases:
                        values.provider === ImportProvider.PROTONPASS
                            ? aliases.reduce((acc: string[], { aliasEmail }) => {
                                  if (aliasEmail) acc.push(aliasEmail);
                                  return acc;
                              }, [])
                            : [],
                },
                onPassphrase: async () => {
                    const res = await onPassphrase();
                    if (res.ok) return res.passphrase;
                    throw new Error();
                },
            });

            if (!isNonEmptyImportPayload(result)) {
                throw new ImportReaderError(c('Pass_file_attachments').t`The file you are trying to import is empty`);
            }

            const { provider } = values;
            const { fileReader, ...data } = result;
            reader = fileReader ?? null;

            /** 2. Prompt the user for vault selection. This
             * can potentially mutate the import payload. */
            const prepared = await onWillSubmit(data);

            if (prepared.ok) {
                const data = prepared.payload;

                /** 3.a Start the item import sequence */
                setProgress({ ...getImportCounts(data), step: 'items' });
                const res = await doImportItems({ data, provider, tabId });
                report = { ...res.data.report };

                /** 4. Start the file import sequence */
                if (res.type === 'success') {
                    setProgress((prev) => (prev ? { ...prev, step: 'files' } : null));

                    const { files } = res.data;
                    const { totalFiles = 0 } = report;
                    const hasFiles = fileReader && totalFiles > 0;

                    if (hasFiles) await importFiles.start(fileReader, files, report, signal);

                    await wait(500);
                    void setValues(getInitialFormValues());
                }
            }
        } catch (error) {
            if (report) report.error = error instanceof Error ? error.name : undefined;

            if (!isAbortError(error)) {
                createNotification({
                    type: 'error',
                    text: c('Warning').t`An error occurred while importing your data.`,
                });
            }
        } finally {
            if (report) dispatch(importReport(report));
            importFiles.reset();
            setProgress(null);
            setBusy(false);
            ctrl.current = null;
            reader?.close();
        }
    }, []);

    const form = useFormik<ImportFormValues>({
        initialValues: getInitialFormValues(),
        initialErrors: { file: '' },
        validateOnChange: true,
        validateOnMount: true,
        validate: validateImportForm,
        onSubmit,
    });

    const onAddFiles = (files: File[]) => {
        try {
            const file = createFileValidator(supportedFileTypes)(files);
            void form.setValues((values) => ({ ...values, file }));
        } catch (e: any) {
            form.setErrors({ file: e.message });
        }
    };

    const onDrop = (files: File[]) => {
        setDropzoneHovered(false);
        onAddFiles(files);
    };

    const onAttach: FileInputProps['onChange'] = (event) => onAddFiles((event.target.files as File[] | null) ?? []);

    return {
        busy,
        dropzone: { hovered: dropzoneHovered, onAttach, onDrop, setSupportedFileTypes },
        form,
        progress: computeProgress(progress, itemProgress, importFiles.progress),
        cancel,
    };
};
