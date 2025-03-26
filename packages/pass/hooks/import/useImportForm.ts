import { type ComponentProps, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors, FormikHelpers } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import type { Dropzone, FileInput } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useFileImporter } from '@proton/pass/hooks/import/useFileImporter';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { ExportFormat } from '@proton/pass/lib/export/types';
import { ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { extractFileExtension, importReader } from '@proton/pass/lib/import/reader';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import { ImportProvider } from '@proton/pass/lib/import/types';
import { importItems } from '@proton/pass/store/actions';
import type { ImportState } from '@proton/pass/store/reducers';
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
    passphrase?: string;
};

type ImportCounts = {
    items: number;
    files: number;
};

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
};

export type OnWillSubmitImportResult = Result<{ payload: ImportPayload }>;
export type OnWillSubmitImport = (payload: ImportPayload) => Promise<OnWillSubmitImportResult>;
type UseImportFormOptions = { onWillSubmit?: OnWillSubmitImport };

const createFileValidator = (allow: string[]) =>
    pipe(
        (files: File[]) => first(files)!,
        orThrow('Unsupported file type', (file) => allow.includes(splitExtension(file?.name)[1]), identity)
    );

const getInitialFormValues = (): ImportFormValues => ({ file: null, provider: null, passphrase: '' });

const validateImportForm = ({ provider, file, passphrase }: ImportFormValues): FormikErrors<ImportFormValues> => {
    const errors: FormikErrors<ImportFormValues> = {};

    if (provider === null) errors.provider = c('Warning').t`No password manager selected`;
    if (!file) errors.file = '';

    if (file && provider === ImportProvider.PROTONPASS) {
        const fileExtension = extractFileExtension(file.name);
        if (fileExtension === ExportFormat.PGP && !Boolean(passphrase)) {
            errors.passphrase = c('Warning').t`PGP encrypted export file requires passphrase`;
        }
    }

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

export const useImportForm = ({
    onWillSubmit: beforeSubmit = (payload) => Promise.resolve({ ok: true, payload }),
}: UseImportFormOptions): ImportFormContext => {
    const { createNotification } = useNotifications();
    const importFiles = useFileImporter();

    const [counts, setCounts] = useState<ImportCounts>({ items: 0, files: 0 });
    const [step, setStep] = useState<MaybeNull<'items' | 'files'>>(null);
    const req = useSelector(selectRequest(importItems.requestID()));
    const itemProgress = req?.status === 'start' ? (req.progress ?? 0) : 0;

    const [busy, setBusy] = useState(false);
    const [dropzoneHovered, setDropzoneHovered] = useState(false);
    const [supportedFileTypes, setSupportedFileTypes] = useState<string[]>([]);

    const result = useSelector(selectLatestImport);
    const user = useSelector(selectUser);
    const aliases = useSelector(selectAliasItems);

    const dispatch = useAsyncRequestDispatch();

    const onSubmit = useCallback(async (values: ImportFormValues, { setValues }: FormikHelpers<ImportFormValues>) => {
        if (!values.provider) return setBusy(false);
        setBusy(true);

        try {
            /** 1. Try to read the imported file. If files are included,
             * `result` will hold a file reader handle to extract files.
             * Import file preparation handles optional decryption. */
            const result = await importReader({
                file: values.file!,
                provider: values.provider,
                passphrase: values.passphrase,
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
            });

            if (!isNonEmptyImportPayload(result)) {
                throw new ImportReaderError(c('Error').t`The file you are trying to import is empty`);
            }

            const { fileReader, ...data } = result;
            const { provider } = values;

            /** 2. Prompt the user for vault selection. This
             * can potentially mutate the import payload. */
            const prepared = await beforeSubmit(data);

            if (prepared.ok) {
                const data = prepared.payload;

                /** 3. Start the item import sequence */
                setCounts(getImportCounts(data));
                setStep('items');
                const res = await dispatch(importItems, { data, provider });

                /** 4. Start the file import sequence */
                if (res.type === 'success') {
                    if (fileReader) {
                        setStep('files');
                        await importFiles.start(fileReader, res.data.files);
                    }

                    void setValues(getInitialFormValues());
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                createNotification({ type: 'error', text: e.message });
            }
        } finally {
            setCounts({ items: 0, files: 0 });
            setStep(null);
            setBusy(false);
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
        result,
        progress: (() => {
            const total = counts.items + counts.files;
            switch (step) {
                case 'items':
                    /** During items phase, show progress relative to total items + files */
                    return Math.ceil((itemProgress / total) * 100);
                case 'files':
                    /** During files phase, add completed items count to current file progress
                     * since items are already processed at this point */
                    return Math.ceil(((counts.items + importFiles.progress) / total) * 100);
                default:
                    return null;
            }
        })(),
    };
};
