import { type ForwardRefRenderFunction, forwardRef, useCallback, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import type { ImportPayload, ImportVault } from '@proton/pass/import';
import { selectAllVaults } from '@proton/pass/store';
import { omit } from '@proton/shared/lib/helpers/object';

import { ImportVaultPickerOption } from './ImportVaultsPickerOption';

type VaultPickerValue = ImportVault & { selected: boolean };
type VaultsPickerFormValues = { vaults: VaultPickerValue[] };
type ImportVaultsPickerProps = { payload: ImportPayload; onSubmit: (payload: ImportPayload) => void };
export type ImportVaultsPickerHandle = { submit: () => void };

const ImportVaultsPickerRef: ForwardRefRenderFunction<ImportVaultsPickerHandle, ImportVaultsPickerProps> = (
    { payload, onSubmit },
    ref
) => {
    const vaults = useSelector(selectAllVaults);

    const handleSubmit = useCallback(
        (values: VaultsPickerFormValues) =>
            onSubmit(
                values.vaults
                    .filter((vault) => vault.selected)
                    .map((vault) => omit(vault, ['selected'])) as ImportPayload
            ),
        [onSubmit]
    );

    const form = useFormik<VaultsPickerFormValues>({
        initialValues: { vaults: payload.map((vault) => ({ ...vault, selected: true })) },
        onSubmit: handleSubmit,
    });

    useImperativeHandle(ref, () => ({ submit: () => handleSubmit(form.values) }), [onSubmit, form.values]);

    return (
        <FormikProvider value={form}>
            <Form>
                <Card rounded className="mb-4 text-sm">
                    {c('Info')
                        .t`Select the destination vault for each vault you are trying to import. By default we will create a new vault for each imported vault.`}
                </Card>

                {payload.map((importedVault) => {
                    const value = form.values.vaults.find(({ id }) => id === importedVault.id)!;
                    const { selected } = value;

                    return (
                        <Card
                            background={!selected}
                            style={{ opacity: selected ? 1 : 0.5 }}
                            rounded
                            key={importedVault.id}
                            className="mb0-75"
                        >
                            <ImportVaultPickerOption
                                value={value.type === 'existing' ? value.shareId : value.id}
                                selected={value.selected}
                                onToggle={(checked) =>
                                    form.setFieldValue(
                                        'vaults',
                                        form.values.vaults.map((vault) => ({
                                            ...vault,
                                            selected: vault.id === value.id ? checked : vault.selected,
                                        }))
                                    )
                                }
                                onChange={async (id) => {
                                    const update: VaultPickerValue =
                                        id === importedVault.id
                                            ? { ...importedVault, selected: true }
                                            : { ...importedVault, type: 'existing', shareId: id, selected: true };

                                    await form.setFieldValue(
                                        'vaults',
                                        form.values.vaults.map((vault) => (vault.id === value.id ? update : vault))
                                    );
                                }}
                                data={importedVault}
                                vaults={vaults}
                            />
                        </Card>
                    );
                })}
            </Form>
        </FormikProvider>
    );
};

export const ImportVaultsPicker = forwardRef(ImportVaultsPickerRef);
