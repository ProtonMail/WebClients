import { type VFC, useMemo } from 'react';

import { Field } from 'formik';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { AttachedFile, Bordered, Dropzone, FileInput, Icon, InlineLinkButton } from '@proton/components/components';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import type { ImportFormContext } from '@proton/pass/hooks/useImportForm';
import { SUPPORTED_IMPORT_FILE_TYPES } from '@proton/pass/hooks/useImportForm';
import { extractFileExtension } from '@proton/pass/lib/import/reader';
import { ImportProvider, ImportProviderValues, PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';
import type { MaybeNull } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ImportProviderItem } from './ImportProviderItem';

import './ImportForm.scss';

const providerHasUnsupportedItemTypes = (provider: ImportProvider) => {
    return (
        provider !== ImportProvider.BRAVE &&
        provider !== ImportProvider.FIREFOX &&
        provider !== ImportProvider.CHROME &&
        provider !== ImportProvider.EDGE &&
        provider !== ImportProvider.SAFARI &&
        provider !== ImportProvider.PROTONPASS
    );
};

export const ImportForm: VFC<Omit<ImportFormContext, 'reset' | 'result'>> = ({ form, dropzone, busy }) => {
    const needsPassphrase = useMemo(
        () =>
            form.values.file &&
            extractFileExtension(form.values.file.name) === 'pgp' &&
            form.values.provider === ImportProvider.PROTONPASS,
        [form.values]
    );

    const onSelectProvider = (provider: MaybeNull<ImportProvider>) => () => form.setFieldValue('provider', provider);

    return (
        <>
            <div className="mb-2">
                <strong>{c('Label').t`Select your password manager`}</strong>
                {form.values.provider && (
                    <InlineLinkButton onClick={onSelectProvider(null)} className="ml-2">
                        {c('Action').t`Change`}
                    </InlineLinkButton>
                )}
            </div>

            {!form.values.provider && (
                <>
                    <div className="pass-import-providers--grid gap-3 mb-4">
                        {ImportProviderValues.map((provider) => (
                            <ImportProviderItem
                                onClick={onSelectProvider(provider)}
                                key={provider}
                                value={provider}
                                title={PROVIDER_INFO_MAP[provider].title}
                                fileExtension={PROVIDER_INFO_MAP[provider].fileExtension}
                            />
                        ))}
                    </div>
                    <Href href="https://protonmail.uservoice.com/forums/953584-proton-pass">{c('Action')
                        .t`Your password manager not here? Request it.`}</Href>
                </>
            )}

            {form.values.provider && (
                <>
                    <div className="flex justify-space-between flex-align-items-center mt-3 mb-4">
                        <div className="flex flex-align-items-center">
                            <div className="mr-2">
                                <img
                                    src={`/assets/${form.values.provider}-icon-48.png`}
                                    width="24"
                                    height="24"
                                    alt=""
                                />
                            </div>
                            <div className="flex flex-column ml-3">
                                <span>{PROVIDER_INFO_MAP[form.values.provider].title}</span>
                                <span className="color-weak">
                                    {PROVIDER_INFO_MAP[form.values.provider].fileExtension}
                                </span>
                            </div>
                        </div>
                        {PROVIDER_INFO_MAP[form.values.provider].tutorialUrl && (
                            <Href
                                href={PROVIDER_INFO_MAP[form.values.provider].tutorialUrl}
                                className="flex flex-align-items-center"
                            >
                                {c('Action').t`How do I export my data from ${
                                    PROVIDER_INFO_MAP[form.values.provider].title
                                }?`}
                                <Icon className="ml-2" name="arrow-out-square" />
                            </Href>
                        )}
                    </div>
                    <Dropzone onDrop={dropzone.onDrop} disabled={busy} border={false}>
                        <Bordered
                            className={clsx([
                                'flex flex-columns justify-center flex-align-items-center relative p-4 mb-4 rounded border-weak min-h-custom pass-import-upload',
                                form.values.file ? 'pass-import-upload--has-file' : 'border-dashed',
                                form.errors.file && 'border-danger',
                            ])}
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
                        </Bordered>
                    </Dropzone>
                    {needsPassphrase && (
                        <Field name="passphrase" label={c('Label').t`Passphrase`} component={PasswordField} />
                    )}
                    {providerHasUnsupportedItemTypes(form.values.provider) && (
                        <em className="block text-sm color-weak mb-2">
                            {c('Info').t`${PASS_APP_NAME} will only import logins, notes and credit cards.`}
                        </em>
                    )}
                </>
            )}
        </>
    );
};
