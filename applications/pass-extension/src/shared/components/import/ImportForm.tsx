import { type VFC, useMemo } from 'react';

import { Field } from 'formik';
import { c } from 'ttag';

import { AttachedFile, Bordered, Dropzone, FileInput, Option, SelectTwo } from '@proton/components/components';
import { ImportProvider, extractFileExtension } from '@proton/pass/import';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { type ImportFormContext, SUPPORTED_IMPORT_FILE_TYPES } from '../../hooks/useImportForm';
import { PasswordField } from '../fields';

export const PROVIDER_TITLE_MAP = {
    [ImportProvider.BITWARDEN]: 'Bitwarden (json)',
    [ImportProvider.BRAVE]: 'Brave (csv)',
    [ImportProvider.CHROME]: 'Chrome (csv)',
    [ImportProvider.EDGE]: 'Edge (csv)',
    [ImportProvider.KEEPASS]: 'KeePass (xml)',
    [ImportProvider.LASTPASS]: 'LastPass (csv)',
    [ImportProvider.ONEPASSWORD]: '1Password (1pux, 1pif)',
    [ImportProvider.PROTONPASS]: `${PASS_APP_NAME} (zip, pgp)`,
};

export const ImportForm: VFC<Omit<ImportFormContext, 'reset' | 'result'>> = ({ form, dropzone, busy }) => {
    const needsPassphrase = useMemo(
        () =>
            form.values.file &&
            extractFileExtension(form.values.file.name) === 'pgp' &&
            form.values.provider === ImportProvider.PROTONPASS,
        [form.values]
    );

    return (
        <>
            <label className="block mb-2 text-bold">{c('Label').t`Provider`}</label>

            <SelectTwo
                value={form.values.provider}
                name="provider"
                onValue={(provider) => form.setFieldValue('provider', provider)}
                className="mb-4"
                disabled={busy}
            >
                {Object.values(ImportProvider).map((provider) => (
                    <Option key={provider} value={provider} title={PROVIDER_TITLE_MAP[provider]}>
                        {PROVIDER_TITLE_MAP[provider]}
                    </Option>
                ))}
            </SelectTwo>

            <label className="block mb-2 text-bold">{c('Label').t`File`}</label>

            <Bordered
                className={clsx([
                    'relative border-dashed mb-4 rounded border-norm',
                    (form.values.file || (dropzone.hovered && !busy)) && 'border-weak',
                    form.errors.file && 'border-danger',
                ])}
            >
                <Dropzone
                    isHovered={dropzone.hovered}
                    onDragEnter={dropzone.onDragEnter}
                    onDragLeave={dropzone.onDragLeave}
                    onDrop={dropzone.onDrop}
                    isDisabled={busy}
                >
                    {form.values.file ? (
                        <AttachedFile
                            file={form.values.file}
                            className={clsx('border-none', busy && 'no-pointer-events')}
                            iconName="file-lines"
                            clear={c('Action').t`Delete`}
                            onClear={() => form.setFieldValue('file', undefined)}
                        />
                    ) : (
                        <FileInput
                            accept={SUPPORTED_IMPORT_FILE_TYPES.map((ext) => `.${ext}`).join(',')}
                            onChange={dropzone.onAttach}
                            disabled={busy}
                            shape="solid"
                            color="weak"
                        >
                            {c('Action').t`Choose a file or drag it here`}
                        </FileInput>
                    )}
                </Dropzone>
            </Bordered>

            {needsPassphrase && <Field name="passphrase" label={c('Label').t`Passphrase`} component={PasswordField} />}
        </>
    );
};
