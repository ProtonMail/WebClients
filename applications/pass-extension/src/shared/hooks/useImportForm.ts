import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import type { Dropzone, FileInput } from '@proton/components/components';
import { onlyDragFiles } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import type { ImportPayload, ImportReaderPayload } from '@proton/pass/import';
import { ImportProvider, ImportProviderValues, extractFileExtension, fileReader } from '@proton/pass/import';
import type { ImportState } from '@proton/pass/store';
import { importItemsIntent, selectLatestImport } from '@proton/pass/store';
import { importItems } from '@proton/pass/store/actions/requests';
import type { Maybe } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';
import { orThrow, pipe } from '@proton/pass/utils/fp/pipe';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import identity from '@proton/utils/identity';
import noop from '@proton/utils/noop';

import { useRequestStatusEffect } from './useRequestStatusEffect';

type DropzoneProps = ComponentProps<typeof Dropzone>;
type FileInputProps = ComponentProps<typeof FileInput>;

export type ImportFormValues = { file: Maybe<File>; provider: ImportProvider; passphrase?: string };

export type ImportFormContext = {
    form: FormikContextType<ImportFormValues>;
    reset: () => void;
    busy: boolean;
    result: ImportState;
    dropzone: {
        hovered: boolean;
        onDragEnter: DropzoneProps['onDragEnter'];
        onDragLeave: DropzoneProps['onDragLeave'];
        onDrop: DropzoneProps['onDrop'];
        onAttach: FileInputProps['onChange'];
    };
};

export type UseImportFormBeforeSubmitValue = { ok: true; payload: ImportPayload } | { ok: false };
export type UseImportFormBeforeSubmit = (payload: ImportPayload) => Promise<UseImportFormBeforeSubmitValue>;

export type UseImportFormOptions = {
    beforeSubmit?: UseImportFormBeforeSubmit;
    onSubmit?: (payload: ImportPayload) => void;
    onImported?: () => void;
};

export const SUPPORTED_IMPORT_FILE_TYPES = ['json', '1pif', '1pux', 'pgp', 'zip', 'csv', 'xml'];

const createFileValidator = (allow: string[]) =>
    pipe(
        (files: File[]) => first(files)!,
        orThrow('Unsupported file type', (file) => allow.includes(splitExtension(file?.name)[1]), identity)
    );

const getInitialFormValues = (): ImportFormValues => ({
    file: undefined,
    provider: ImportProviderValues[0],
    passphrase: '',
});

const validateImportForm = ({ provider, file, passphrase }: ImportFormValues): FormikErrors<ImportFormValues> => {
    const errors: FormikErrors<ImportFormValues> = {};

    if (provider === undefined) {
        errors.provider = c('Warning').t`No provider selected`;
    }

    if (file === undefined) {
        errors.file = '';
    }

    if (file && provider === ImportProvider.PROTONPASS) {
        const fileExtension = extractFileExtension(file.name);
        if (fileExtension === 'pgp' && !Boolean(passphrase)) {
            errors.passphrase = c('Warning').t`PGP encrypted export file requires passphrase`;
        }
    }

    return errors;
};

export const useImportForm = ({
    beforeSubmit = (payload) => Promise.resolve({ ok: true, payload }),
    onSubmit,
    onImported = noop,
}: UseImportFormOptions): ImportFormContext => {
    const dispatch = useDispatch();

    const [busy, setBusy] = useState(false);
    const [dropzoneHovered, setDropzoneHovered] = useState(false);
    const { createNotification } = useNotifications();
    const result = useSelector(selectLatestImport);

    const form: FormikContextType<ImportFormValues> = useFormik<ImportFormValues>({
        initialValues: getInitialFormValues(),
        initialErrors: { file: '' },
        validateOnChange: true,
        validateOnMount: true,
        validate: validateImportForm,
        onSubmit: async (values) => {
            try {
                setBusy(true);
                const payload: ImportReaderPayload = {
                    file: values.file!,
                    provider: values.provider,
                    passphrase: values.passphrase,
                };

                const result = await beforeSubmit(await fileReader(payload));

                if (!result.ok) {
                    return setBusy(false);
                }
                onSubmit?.(result.payload);
                dispatch(importItemsIntent({ data: result.payload, provider: values.provider }));
            } catch (e) {
                setBusy(false);
                if (e instanceof Error) {
                    createNotification({ type: 'error', text: e.message });
                }
            }
        },
    });

    const reset = () => {
        form.setValues(getInitialFormValues());
        setBusy(false);
    };

    const onAddFiles = (files: File[]) => {
        try {
            const file = createFileValidator(SUPPORTED_IMPORT_FILE_TYPES)(files);
            form.setValues((values) => ({ ...values, file }));
        } catch (e: any) {
            form.setErrors({ file: e.message });
        }
    };

    const createDragEventHandler: (hover: boolean) => DropzoneProps['onDragEnter' | 'onDragLeave'] = (hover: boolean) =>
        onlyDragFiles((event) => {
            setDropzoneHovered(hover);
            event.stopPropagation();
        });

    const onDrop = onlyDragFiles((event) => {
        event.preventDefault();
        setDropzoneHovered(false);
        onAddFiles([...event.dataTransfer.files]);
    });

    const onAttach: FileInputProps['onChange'] = (event) => onAddFiles((event.target.files as File[] | null) ?? []);

    useRequestStatusEffect(importItems(), {
        onSuccess: () => pipe(reset, onImported),
        onFailure: () => setBusy(false),
    });

    return {
        form,
        reset,
        busy,
        result,
        dropzone: {
            hovered: dropzoneHovered,
            onDragEnter: createDragEventHandler(true),
            onDragLeave: createDragEventHandler(false),
            onAttach,
            onDrop,
        },
    };
};
