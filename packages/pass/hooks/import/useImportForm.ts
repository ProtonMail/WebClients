import { type ComponentProps, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import type { Dropzone, FileInput } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useFileImporter } from '@proton/pass/hooks/import/useFileImporter';
import { useRequestDispatch } from '@proton/pass/hooks/useRequest';
import { ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { importReader } from '@proton/pass/lib/import/reader';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import { ImportProvider } from '@proton/pass/lib/import/types';
import { importItems } from '@proton/pass/store/actions';
import type { ImportState } from '@proton/pass/store/reducers';
import { requestCancel } from '@proton/pass/store/request/actions';
import { selectAliasItems, selectLatestImport, selectRequest, selectUser } from '@proton/pass/store/selectors';
import type { MaybeNull, Result } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { orThrow, pipe } from '@proton/pass/utils/fp/pipe';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import identity from '@proton/utils/identity';

type DropzoneProps = ComponentProps<typeof Dropzone>;
type FileInputProps = ComponentProps<typeof FileInput>;

export type ImportFormValues = {
    file: MaybeNull<File>;
    provider: MaybeNull<ImportProvider>;
};

type ImportCounts = { items: number; files: number };
type ImportProgress = ImportCounts & { step: 'items' | 'files' };

export type ImportFormContext = {
    busy: boolean;
    form: FormikContextType<ImportFormValues>;
    progress: MaybeNull<number>;
    result: ImportState;
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

const createFileValidator = (allow: string[]) =>
    pipe(
        (files: File[]) => first(files)!,
        orThrow('Unsupported file type', (file) => allow.includes(splitExtension(file?.name)[1]), identity)
    );

const getInitialFormValues = (): ImportFormValues => ({ file: null, provider: null });

const validateImportForm = ({ provider, file }: ImportFormValues): FormikErrors<ImportFormValues> => {
    const errors: FormikErrors<ImportFormValues> = {};
    if (provider === null) errors.provider = c('Warning').t`No password manager selected`;
    if (!file) errors.file = '';

    return errors;
};

const isNonEmptyImportPayload = (payload: ImportPayload) =>
    payload.vaults.length > 0 && payload.vaults.some(({ items }) => items.length > 0);

const getImportCounts = (data: ImportPayload): ImportCounts =>
    data.vaults.reduce<ImportCounts>(
        (counts, { items }) => {
            counts.items += items.length;
            items.forEach(({ files }) => {
                counts.files += files?.length ?? 0;
            });

            return counts;
        },
        { items: 0, files: 0 }
    );

export const useImportForm = ({ onPassphrase, onWillSubmit }: UseImportFormOptions): ImportFormContext => {
    const { createNotification } = useNotifications();
    const ctrl = useRef<MaybeNull<AbortController>>(null);
    const importFiles = useFileImporter();

    const [progress, setProgress] = useState<MaybeNull<ImportProgress>>(null);
    const req = useSelector(selectRequest(importItems.requestID()));
    const itemProgress = req?.status === 'start' ? (req.progress ?? 0) : 0;

    const [busy, setBusy] = useState(false);
    const [dropzoneHovered, setDropzoneHovered] = useState(false);
    const [supportedFileTypes, setSupportedFileTypes] = useState<string[]>([]);

    const result = useSelector(selectLatestImport);
    const user = useSelector(selectUser);
    const aliases = useSelector(selectAliasItems);

    const dispatch = useDispatch();
    const doImportItems = useRequestDispatch(importItems);

    const onSubmit = useCallback(async (values: ImportFormValues, { setValues }: FormikHelpers<ImportFormValues>) => {
        ctrl.current?.abort();
        ctrl.current = new AbortController();

        if (!values.provider) return setBusy(false);
        setBusy(true);

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
                throw new ImportReaderError(c('Error').t`The file you are trying to import is empty`);
            }

            const { fileReader, ...data } = result;
            const { provider } = values;

            /** 2. Prompt the user for vault selection. This
             * can potentially mutate the import payload. */
            const prepared = await onWillSubmit(data);

            if (prepared.ok) {
                const data = prepared.payload;

                /** 3. Start the item import sequence */
                setProgress({ ...getImportCounts(data), step: 'items' });
                const res = await doImportItems({ data, provider });

                /** 4. Start the file import sequence */
                if (res.type === 'success' && !ctrl.current.signal?.aborted) {
                    if (fileReader) {
                        setProgress((prev) => (prev ? { ...prev, step: 'files' } : null));
                        await importFiles.start(fileReader, res.data.files, ctrl.current.signal);
                    }

                    void setValues(getInitialFormValues());
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                console.warn(e);
                createNotification({ type: 'error', text: e.message });
            }
        } finally {
            setProgress(null);
            setBusy(false);
            ctrl.current = null;
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

    const cancel = useCallback(() => {
        importFiles.cancel();
        ctrl.current?.abort();
        dispatch(requestCancel(importItems.requestID()));
        setProgress(null);
    }, []);

    return {
        busy,
        dropzone: { hovered: dropzoneHovered, onAttach, onDrop, setSupportedFileTypes },
        form,
        result,
        progress: (() => {
            if (!progress) return null;
            const total = progress.items + progress.files;
            switch (progress.step) {
                case 'items':
                    /** During items phase, show progress relative to total items + files */
                    return Math.ceil((itemProgress / total) * 100);
                case 'files':
                    /** During files phase, add completed items count to current file progress
                     * since items are already processed at this point */
                    return Math.ceil(((progress.items + importFiles.progress) / total) * 100);
                default:
                    return null;
            }
        })(),
        cancel,
    };
};
