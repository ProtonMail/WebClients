import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Field, Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { FeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { RadioGroupField } from '@proton/pass/components/Form/Field/RadioGroupField';
import { ToggleField } from '@proton/pass/components/Form/Field/ToggleField';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { ExportFormat, type ExportRequestOptions } from '@proton/pass/lib/export/types';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { selectNonOwnedVaults, selectUserStorageAllowed, selectUserStorageUsed } from '@proton/pass/store/selectors';
import { BitField } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { truthy } from '@proton/pass/utils/fp/predicates';

export type ExporterProps = { form: FormikContextType<ExportRequestOptions>; loading: boolean };

export const ExportForm: FC<ExporterProps> = ({ form, loading = false }) => {
    const online = useConnectivity();
    const hasNonOwnedVaults = useSelector(selectNonOwnedVaults).length > 0;
    const usedStorage = useSelector(selectUserStorageUsed);
    const canUseStorage = useSelector(selectUserStorageAllowed);
    const upsell = useUpselling();
    const org = useOrganization({ sync: true });
    const orgExportDisabled = !org?.b2bAdmin && org?.settings.ExportMode === BitField.ACTIVE;
    const disabled = orgExportDisabled || !online;

    const warnings = useMemo(
        () =>
            [
                /* Safari ZIP warning */
                BUILD_TARGET === 'safari' &&
                    form.values.format === ExportFormat.ZIP &&
                    c('Info')
                        .t`Before exporting your data with this format, please open Safari settings -> "General" tab -> disable the option "Open safe files after downloading". This will prevent Safari from incorrectly extracting the exported file.`,

                /* CSV warning */
                form.values.format === ExportFormat.CSV &&
                    c('Info')
                        .t`CSV offers a convenient format to view your data. However due to its simplicity, some data will not be included (custom fields, passkeys...). For a complete export, we recommend using a different format.`,

                /* non-encrypted warning */
                form.values.format !== ExportFormat.PGP &&
                    c('Info')
                        .t`This export will be unencrypted and anyone with access to your exported file will be able to see your passwords. For security, please delete it after you are done using it.`,

                /* Owned vault warning */
                hasNonOwnedVaults && c('Info').t`The export will only contain vaults that you own.`,
            ].filter(truthy),
        [form.values.format, hasNonOwnedVaults]
    );

    return (
        <FormikProvider value={form}>
            <Form className="modal-two-dialog-container">
                <div className="flex align-center items-center gap-4 mb-4">
                    <Field
                        name="format"
                        className="flex flex-nowrap ml-2 mt-2 mb-2"
                        component={RadioGroupField}
                        options={[
                            {
                                value: ExportFormat.PGP,
                                label: c('Label').t`PGP-encrypted (recommended)`,
                            },
                            {
                                value: ExportFormat.ZIP,
                                label: c('Label').t`ZIP`,
                            },
                            {
                                value: ExportFormat.CSV,
                                label: 'CSV',
                            },
                        ]}
                        checked={form.values.format}
                        label={c('Label').t`File format`}
                        disabled={disabled}
                    />
                </div>

                {warnings.length > 0 && (
                    <Card className="mb-4 p-1 flex flex-column flex-nowrap gap-2 text-sm" type="primary">
                        {warnings.map((text, idx) => (
                            <div key={`warning-${idx}`} className={'flex items-start flex-nowrap w-full gap-2'}>
                                <Icon name="info-circle-filled" size={3} className="shrink-0 mt-0.5" />
                                <span>{text}</span>
                            </div>
                        ))}
                    </Card>
                )}

                {/* Disable memory file attachments export for perf reasons */}
                {usedStorage > 0 && form.values.format !== ExportFormat.CSV && fileStorage.type !== 'Memory' && (
                    <FeatureFlag feature={PassFeature.PassFileAttachments}>
                        <Field
                            name="fileAttachments"
                            component={ToggleField}
                            checked={form.values.fileAttachments}
                            disabled={disabled}
                            className="my-4"
                            {...(canUseStorage
                                ? {}
                                : {
                                      onChange: () => {
                                          upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS });
                                          void form.setFieldValue('fileAttachments', false);
                                      },
                                  })}
                        >
                            <span className="pl-2">
                                {c('Pass_file_attachments').t`Include file attachments`}
                                <span className="block color-weak text-sm">
                                    {c('Pass_file_attachments')
                                        .t`If enabled, all your files will be downloaded when exporting. This may take some time depending on your internet connection.`}
                                </span>
                            </span>
                        </Field>
                        {form.values.fileAttachments && form.values.format === ExportFormat.PGP && (
                            <Card className="my-4 p-1 text-sm" type="warning">
                                <div className={'flex items-start flex-nowrap w-full gap-2'}>
                                    <Icon name="info-circle-filled" size={3} className="shrink-0 mt-0.5" />
                                    <span>{c('Pass_file_attachments')
                                        .t`The exported file attachments will not be encrypted.`}</span>
                                </div>
                            </Card>
                        )}
                    </FeatureFlag>
                )}

                {form.values.format === ExportFormat.PGP && (
                    <>
                        <hr className="mt-2 mb-4 border-weak shrink-0" />

                        <Field
                            name="passphrase"
                            label={
                                <div>
                                    {c('Label').t`Passphrase`}{' '}
                                    <em className="block text-normal text-sm color-weak my-1">
                                        {c('Info')
                                            .t`The exported file will be encrypted using PGP and requires a strong passphrase.`}
                                    </em>
                                </div>
                            }
                            component={PasswordField}
                            autoComplete="new-password"
                            disabled={disabled}
                            data-protonpass-ignore={true}
                        />
                    </>
                )}

                {orgExportDisabled && (
                    <Card className="mb-4 p-1 text-sm" type="primary">
                        <div>{c('Info').t`This setting is disabled on the organization level`}</div>
                    </Card>
                )}

                <Button
                    type="submit"
                    color="norm"
                    loading={loading}
                    disabled={!form.isValid || loading || disabled}
                    className="mt-5 w-full"
                >
                    {c('Action').t`Export`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
