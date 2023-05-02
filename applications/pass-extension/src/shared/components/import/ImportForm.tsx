import { type VFC } from 'react';

import { Field } from 'formik';
import { c } from 'ttag';

import { AttachedFile, Bordered, Dropzone, FileInput, Option, SelectTwo } from '@proton/components/components';
import { ImportProvider } from '@proton/pass/import';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { type ImportFormContext, SUPPORTED_IMPORT_FILE_TYPES } from '../../hooks/useImportForm';
import { PasswordField } from '../fields';

export const PROVIDER_TITLE_MAP = {
    [ImportProvider.BITWARDEN]: 'Bitwarden',
    [ImportProvider.CHROME]: 'Chrome, Brave, Edge (CSV)',
    [ImportProvider.KEEPASS]: 'KeePass (XML)',
    [ImportProvider.LASTPASS]: 'LastPass',
    [ImportProvider.ONEPASSWORD]: '1Password (1PUX)',
    [ImportProvider.PROTONPASS]: PASS_APP_NAME,
    [ImportProvider.PROTONPASS_PGP]: `${PASS_APP_NAME} (PGP encrypted)`,
};

export const ImportForm: VFC<Omit<ImportFormContext, 'reset' | 'result'>> = ({ form, dropzone, busy }) => (
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

        <Field
            name="passphrase"
            label={c('Label').t`Passphrase`}
            component={PasswordField}
            disabled={form.values.provider !== ImportProvider.PROTONPASS_PGP}
        />
    </>
);
