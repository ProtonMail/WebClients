import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import type { Dropzone, FileInput } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { extractFileExtension, fileReader } from '@proton/pass/lib/import/reader';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import { ImportProvider } from '@proton/pass/lib/import/types';
import { importItemsIntent } from '@proton/pass/store/actions';
import { itemsImportRequest } from '@proton/pass/store/actions/requests';
import type { ImportState } from '@proton/pass/store/reducers';
import { selectAliasItems, selectLatestImport, selectUser } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { first } from '@proton/pass/utils/array/first';
import { fileToTransferable } from '@proton/pass/utils/file/transferable-file';
import { orThrow, pipe } from '@proton/pass/utils/fp/pipe';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import identity from '@proton/utils/identity';

type DropzoneProps = ComponentProps<typeof Dropzone>;
type FileInputProps = ComponentProps<typeof FileInput>;

export type ImportFormValues = { file: MaybeNull<File>; provider: MaybeNull<ImportProvider>; passphrase?: string };

export type ImportFormContext = {
    form: FormikContextType<ImportFormValues>;
    busy: boolean;
    result: ImportState;
    dropzone: {
        hovered: boolean;
        onDrop: DropzoneProps['onDrop'];
        onAttach: FileInputProps['onChange'];
        setSupportedFileTypes: (fileTypes: string[]) => void;
    };
};

export type UseImportFormBeforeSubmitValue = { ok: true; payload: ImportPayload } | { ok: false };
export type UseImportFormBeforeSubmit = (payload: ImportPayload) => Promise<UseImportFormBeforeSubmitValue>;

export type UseImportFormOptions = {
    beforeSubmit?: UseImportFormBeforeSubmit;
    onSubmit?: (payload: ImportPayload) => void;
};

export const SUPPORTED_IMPORT_FILE_TYPES = ['json', '1pif', '1pux', 'pgp', 'zip', 'csv', 'xml'];

const createFileValidator = (allow: string[]) =>
    pipe(
        (files: File[]) => first(files)!,
        orThrow('Unsupported file type', (file) => allow.includes(splitExtension(file?.name)[1]), identity)
    );

const getInitialFormValues = (): ImportFormValues => ({
    file: null,
    provider: null,
    passphrase: '',
});

const validateImportForm = ({ provider, file, passphrase }: ImportFormValues): FormikErrors<ImportFormValues> => {
    const errors: FormikErrors<ImportFormValues> = {};

    if (provider === null) errors.provider = c('Warning').t`No password manager selected`;
    if (!file) errors.file = '';

    if (file && provider === ImportProvider.PROTONPASS) {
        const fileExtension = extractFileExtension(file.name);
        if (fileExtension === 'pgp' && !Boolean(passphrase)) {
            errors.passphrase = c('Warning').t`PGP encrypted export file requires passphrase`;
        }
    }

    return errors;
};

const isNonEmptyImportPayload = (payload: ImportPayload) =>
    payload.vaults.length > 0 && payload.vaults.some(({ items }) => items.length > 0);

export const useImportForm = ({
    beforeSubmit = (payload) => Promise.resolve({ ok: true, payload }),
    onSubmit,
}: UseImportFormOptions): ImportFormContext => {
    const { prepareImport } = usePassCore();
    const { createNotification } = useNotifications();
    const usernameSplitEnabled = useFeatureFlag(PassFeature.PassUsernameSplit);

    const [busy, setBusy] = useState(false);
    const [dropzoneHovered, setDropzoneHovered] = useState(false);
    const [supportedFileTypes, setSupportedFileTypes] = useState<string[]>([]);
    const formRef = useRef<FormikContextType<ImportFormValues>>();

    const result = useSelector(selectLatestImport);
    const user = useSelector(selectUser);
    const aliases = useSelector(selectAliasItems);

    const importItems = useActionRequest(importItemsIntent, {
        initialRequestId: itemsImportRequest(),
        onSuccess: () => {
            setBusy(false);
            void formRef.current?.setValues(getInitialFormValues());
        },
        onFailure: () => setBusy(false),
    });

    const form = useFormik<ImportFormValues>({
        initialValues: getInitialFormValues(),
        initialErrors: { file: '' },
        validateOnChange: true,
        validateOnMount: true,
        validate: validateImportForm,
        onSubmit: async (values) => {
            if (!values.provider) return setBusy(false);
            setBusy(true);

            try {
                const importPayload = await fileReader(
                    await prepareImport({
                        file: await fileToTransferable(values.file!),
                        provider: values.provider,
                        passphrase: values.passphrase,
                        userId: user?.ID,
                        options: {
                            importUsername: usernameSplitEnabled,
                            currentAliases:
                                values.provider === ImportProvider.PROTONPASS
                                    ? aliases.reduce((acc: string[], { aliasEmail }) => {
                                          if (aliasEmail) acc.push(aliasEmail);
                                          return acc;
                                      }, [])
                                    : [],
                        },
                    })
                );

                if (!isNonEmptyImportPayload(importPayload)) {
                    throw new ImportReaderError(c('Error').t`The file you are trying to import is empty`);
                }

                const result = await beforeSubmit(importPayload);

                if (result.ok) {
                    onSubmit?.(result.payload);
                    importItems.dispatch({ data: result.payload, provider: values.provider });
                }
            } catch (e) {
                if (e instanceof Error) {
                    createNotification({ type: 'error', text: e.message });
                }
            } finally {
                setBusy(false);
            }
        },
    });

    formRef.current = form;

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
        onAddFiles([...files]);
    };

    const onAttach: FileInputProps['onChange'] = (event) => onAddFiles((event.target.files as File[] | null) ?? []);

    return {
        busy,
        dropzone: { hovered: dropzoneHovered, onAttach, onDrop, setSupportedFileTypes },
        form,
        result,
    };
};
