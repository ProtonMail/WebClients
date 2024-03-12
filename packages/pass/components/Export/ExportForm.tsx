import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { Field, Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { RadioGroupField } from '@proton/pass/components/Form/Field/RadioGroupField';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { type ExportFormValues, ExportFormat } from '@proton/pass/lib/export/types';
import { selectNonOwnedVaults } from '@proton/pass/store/selectors';
import { BitField } from '@proton/pass/types';

type ExporterProps = { form: FormikContextType<ExportFormValues>; loading: boolean };

export const ExportForm: FC<ExporterProps> = ({ form, loading = false }) => {
    const hasNonOwnedVaults = useSelector(selectNonOwnedVaults).length > 0;
    const org = useOrganization();
    const organizationExportLimit = org?.settings.ExportMode === BitField.ACTIVE;

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
                                label: c('Label').t`PGP-encrypted JSON (recommended)`,
                            },
                            {
                                value: ExportFormat.ZIP,
                                label: c('Label').t`JSON`,
                            },
                            {
                                value: ExportFormat.CSV,
                                label: 'CSV',
                            },
                        ]}
                        checked={form.values.format}
                        label={c('Label').t`File format`}
                        disabled={organizationExportLimit}
                    />
                </div>

                {form.values.format === ExportFormat.CSV && (
                    <Card className="mb-4 p-1">
                        <div>{c('Info')
                            .t`CSV offers a convenient format to view your data. However due to its simplicity, some data will not be included (custom fields, vault structure...). For a complete export, we recommend using a different format.`}</div>
                    </Card>
                )}

                {hasNonOwnedVaults && (
                    <em className="block text-sm color-weak mb-2">
                        {c('Info').t`The export will only contain vaults that you own.`}
                    </em>
                )}

                {form.values.format === ExportFormat.PGP ? (
                    <>
                        <em className="block text-sm color-weak mb-2">
                            {c('Info')
                                .t`The exported file will be encrypted using PGP and requires a strong passphrase.`}
                        </em>
                        <Field
                            name="passphrase"
                            label={c('Label').t`Passphrase`}
                            component={PasswordField}
                            autoComplete="new-password"
                        />
                    </>
                ) : (
                    <em className="block text-sm color-weak mt-2">
                        {c('Info')
                            .t`This export will be unencrypted and anyone with access to your exported file will be able to see your passwords. For security, please delete it after you are done using it.`}
                    </em>
                )}

                {organizationExportLimit && (
                    <Card className="mb-4 p-1">
                        <div>{c('Info').t`This setting is disabled on the organization level`}</div>
                    </Card>
                )}

                <Button
                    type="submit"
                    color="norm"
                    loading={loading}
                    disabled={!form.isValid || loading || organizationExportLimit}
                    className="mt-3 w-full"
                >
                    {c('Action').t`Export`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
