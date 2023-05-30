import { type ForwardRefRenderFunction, forwardRef, useCallback, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import type { ImportPayload, ImportVault } from '@proton/pass/import';
import { selectAllVaults, selectPrimaryVault, selectVaultLimits } from '@proton/pass/store';
import { merge } from '@proton/pass/utils/object';
import { omit } from '@proton/shared/lib/helpers/object';

import { UpgradeButton } from '../upgrade/UpgradeButton';
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
    const primaryVault = useSelector(selectPrimaryVault);
    const { vaultLimit, vaultTotalCount } = useSelector(selectVaultLimits);
    /* needs upgrade needs to be dynamically computed based on the number
     * of potential vaults the import will try to create */
    const needsUpgrade = vaultTotalCount + payload.vaults.length > vaultLimit;

    const handleSubmit = useCallback(
        (values: VaultsPickerFormValues) =>
            onSubmit({
                vaults: values.vaults
                    .filter((vault) => vault.selected)
                    .map((vault) => omit(vault, ['selected']) as ImportVault),
                ignored: payload.ignored,
                warnings: payload.warnings,
            }),
        [onSubmit]
    );

    /* Reconciliating the vaults payload involves always ensuring we will
     * not try to create more vaults then what the current user plan allows */
    const reconciliateVaults = useCallback((values: VaultPickerValue[], update?: VaultPickerValue) => {
        const remaining = vaultLimit - vaultTotalCount - (update?.type === 'new' ? 1 : 0);

        return values.reduce<{
            vaults: VaultPickerValue[];
            remaining: number;
        }>(
            (acc, vault) => {
                if (vault.id === update?.id) acc.vaults.push(update);
                else {
                    if (vault.type === 'new' && acc.remaining <= 0) {
                        acc.vaults.push(
                            merge(vault, {
                                type: 'existing',
                                shareId: primaryVault.shareId,
                                vaultName: primaryVault.content.name,
                            })
                        );
                    } else {
                        acc.vaults.push(vault);
                        acc.remaining -= 1;
                    }
                }

                return acc;
            },
            { vaults: [], remaining }
        ).vaults;
    }, []);

    const form = useFormik<VaultsPickerFormValues>({
        onSubmit: handleSubmit,
        initialValues: {
            vaults: reconciliateVaults(
                payload.vaults.map((vault) => ({
                    ...vault,
                    selected: true,
                }))
            ),
        },
    });

    useImperativeHandle(ref, () => ({ submit: () => handleSubmit(form.values) }), [onSubmit, form.values]);

    return (
        <FormikProvider value={form}>
            <Form>
                <Card rounded className="mb-4 text-sm">
                    {c('Info')
                        .t`Select the destination vault for each imported vault. By default a new vault will be created for each imported vault.`}

                    {needsUpgrade && (
                        <>
                            <hr className="mt-2 mb-2" />
                            {c('Warning')
                                .t`Your subscription does not allow you to create multiple vaults. All items will be imported to your primary vault by default. To import into multiple vaults upgrade your subscription.`}
                            <UpgradeButton inline className="ml-1" />
                        </>
                    )}
                </Card>

                {payload.vaults.map((importedVault) => {
                    const value = form.values.vaults.find(({ id }) => id === importedVault.id)!;
                    const { selected } = value;

                    return (
                        <Card
                            background={!selected}
                            style={{ opacity: selected ? 1 : 0.5 }}
                            rounded
                            key={importedVault.id}
                            className="mb-3"
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
                                onChange={async (id) =>
                                    form.setFieldValue(
                                        'vaults',
                                        reconciliateVaults(
                                            form.values.vaults,
                                            id === importedVault.id
                                                ? { ...importedVault, selected: true }
                                                : { ...importedVault, type: 'existing', shareId: id, selected: true }
                                        )
                                    )
                                }
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
