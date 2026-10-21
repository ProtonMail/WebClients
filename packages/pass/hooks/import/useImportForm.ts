import { type ComponentProps, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import type Dropzone from '@proton/components/components/dropzone/Dropzone';
import type FileInput from '@proton/components/components/input/FileInput';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { wait } from '@proton/shared/lib/helpers/promise';
import identity from '@proton/utils/identity';
import noop from '@proton/utils/noop';

import { useCurrentTabID } from '../../components/Core/PassCoreProvider';
import { useFoldersAccess } from '../../components/Folders/useFoldersAccess';
import { isAbortError } from '../../lib/api/errors';
import { ImportReaderError } from '../../lib/import/helpers/error';
import { splitFoldersIntoVaults } from '../../lib/import/helpers/folders';
import type { ImportProgress, ImportReport } from '../../lib/import/helpers/report';
import { computeProgress, getImportCounts } from '../../lib/import/helpers/report';
import { importReader } from '../../lib/import/reader';
import type { ImportEntryPoint, ImportFileReader, ImportPayload } from '../../lib/import/types';
import { ImportProvider, getSupportedFileTypes } from '../../lib/import/types';
import { importItems, importReport } from '../../store/actions/creators/import';
import { requestCancel } from '../../store/request/actions';
import { selectRequestProgress } from '../../store/request/selectors';
import { selectAllAliasItems } from '../../store/selectors/items';
import { selectUser } from '../../store/selectors/user';
import type { MaybeNull, Result } from '../../types/utils';
import { first } from '../../utils/array/first';
import { orThrow, pipe } from '../../utils/fp/pipe';
import { useDebouncedValue } from '../useDebouncedValue';
import { useMemoSelector } from '../useMemoSelector';
import { useRequestDispatch } from '../useRequest';
import { useStatefulRef } from '../useStatefulRef';
import { useFileImporter } from './useFileImporter';

type DropzoneProps = ComponentProps<typeof Dropzone>;
type FileInputProps = ComponentProps<typeof FileInput>;

type ImportFormValues = {
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

type OnPassphraseImport = () => Promise<OnPassphraseImportResult>;
export type OnWillSubmitImport = (payload: ImportPayload) => Promise<OnWillSubmitImportResult>;

type UseImportFormOptions = {
    importEntryPoint: ImportEntryPoint;
    onPassphrase: OnPassphraseImport;
    onWillSubmit: OnWillSubmitImport;
    onSuccess?: () => void;
    provider?: MaybeNull<ImportProvider>;
};

const getInitialFormValues = (provider: MaybeNull<ImportProvider>): ImportFormValues => ({
    file: null,
    provider,
});

const createFileValidator = (allow: string[]) =>
    pipe(
        (files: File[]) => first(files)!,
        orThrow(c('Error').t`Unsupported file type`, (file) => allow.includes(splitExtension(file?.name)[1]), identity)
    );

const validateImportForm = ({ provider, file }: ImportFormValues): FormikErrors<ImportFormValues> => {
    const errors: FormikErrors<ImportFormValues> = {};
    if (provider === null) errors.provider = c('Warning').t`No password manager selected`;
    if (!file) errors.file = '';

    return errors;
};

const isNonEmptyImportPayload = (payload: ImportPayload) =>
    payload.vaults.length > 0 && payload.vaults.some(({ items }) => items.length > 0);

export const useImportForm = ({
    importEntryPoint,
    onPassphrase,
    onWillSubmit,
    onSuccess = noop,
    provider: initialProvider = null,
}: UseImportFormOptions): ImportFormContext => {
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
    const [supportedFileTypes, setSupportedFileTypes] = useState<string[]>(getSupportedFileTypes(initialProvider));

    const user = useSelector(selectUser);
    const aliases = useSelector(selectAllAliasItems);
    const foldersAccess = useStatefulRef(useFoldersAccess());

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

        const commitReport = () => {
            if (!report) return;
            dispatch(importReport(report));
            report = null;
        };

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
            const { fileReader, ...payload } = result;
            const { canUseFolders } = foldersAccess.current;
            const data = canUseFolders ? payload : { ...payload, vaults: splitFoldersIntoVaults(payload.vaults) };
            reader = fileReader ?? null;

            /** 2. Prompt the user for vault selection. This
             * can potentially mutate the import payload. */
            const prepared = await onWillSubmit(data);

            if (prepared.ok) {
                const data = prepared.payload;

                /** 3.a Start the item import sequence */
                setProgress({ ...getImportCounts(data), step: 'items' });
                const res = await doImportItems({ data, provider, importEntryPoint, tabId });
                report = { ...res.data.report };

                /** 4. Start the file import sequence */
                if (res.type === 'success') {
                    setProgress((prev) => (prev ? { ...prev, step: 'files' } : null));

                    const { files } = res.data;
                    const { totalFiles = 0 } = report;
                    const hasFiles = fileReader && totalFiles > 0;

                    if (hasFiles) await importFiles.start(fileReader, files, report, signal);

                    await wait(500);
                    void setValues(getInitialFormValues(initialProvider));

                    /** Commit before `onSuccess` : consumers may navigate to a view
                     * reading the report from the store. On extension clients this only
                     * lands synchronously because `importReport` is tagged as a
                     * synchronous action — see `relayMiddleware`. */
                    commitReport();
                    onSuccess();
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
            commitReport();
            importFiles.reset();
            setProgress(null);
            setBusy(false);
            ctrl.current = null;
            reader?.close();
        }
    }, []);

    const form = useFormik<ImportFormValues>({
        initialValues: getInitialFormValues(initialProvider),
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
            createNotification({ type: 'error', text: e.message });
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
