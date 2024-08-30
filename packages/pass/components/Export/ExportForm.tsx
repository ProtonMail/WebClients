import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Field, Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { RadioGroupField } from '@proton/pass/components/Form/Field/RadioGroupField';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { type ExportFormValues, ExportFormat } from '@proton/pass/lib/export/types';
import { selectNonOwnedVaults } from '@proton/pass/store/selectors';
import { BitField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

type ExporterProps = { form: FormikContextType<ExportFormValues>; loading: boolean };

export const ExportForm: FC<ExporterProps> = ({ form, loading = false }) => {
    const hasNonOwnedVaults = useSelector(selectNonOwnedVaults).length > 0;
    const org = useOrganization({ sync: true });
    const orgExportDisabled = !org?.b2bAdmin && org?.settings.ExportMode === BitField.ACTIVE;

    const warnings = useMemo(
        () =>
            [
                /* Safari ZIP warning */
                BUILD_TARGET === 'safari' &&
                    form.values.format === ExportFormat.ZIP &&
                    c('Info')
                        .t`Before exporting your data with this format, please open Safari settings -> "General" tab -> disable the option "Open safe files after downloading". This will prevent Safari from incorrectly extracting the exported file.`,

                /* Safari PGP warning */
                BUILD_TARGET === 'safari' &&
                    form.values.format === ExportFormat.PGP &&
                    c('Info')
                        .t`Due to a limitation of Safari browser extensions, after exporting the data the file extension will be missing ".pgp". Please rename the file to include the .pgp extension (e.g file.pgp) after exporting.`,

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
                        disabled={orgExportDisabled}
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
                    disabled={!form.isValid || loading || orgExportDisabled}
                    className="mt-5 w-full"
                >
                    {c('Action').t`Export`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
