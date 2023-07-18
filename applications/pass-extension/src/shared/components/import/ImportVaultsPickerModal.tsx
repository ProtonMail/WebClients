import type { VFC } from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import type { ModalProps } from '@proton/components/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import { type ImportPayload, type ImportVault } from '@proton/pass/import';
import { selectAllVaults, selectPassPlan, selectPrimaryVault, selectVaultLimits } from '@proton/pass/store';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { omit } from '@proton/shared/lib/helpers/object';

import { UpgradeButton } from '../upgrade/UpgradeButton';
import { ImportVaultPickerOption } from './ImportVaultsPickerOption';

type VaultPickerValue = ImportVault & { selected: boolean };
type VaultsPickerFormValues = { vaults: VaultPickerValue[] };
type ImportVaultsPickerProps = Omit<ModalProps, 'onSubmit'> & {
    payload: ImportPayload;
    onSubmit: (payload: ImportPayload) => void;
};
export type ImportVaultsPickerHandle = { submit: () => void };

const FORM_ID = 'vault-picker';

export const ImportVaultsPickerModal: VFC<ImportVaultsPickerProps> = ({ payload, onClose, onReset, onSubmit }) => {
    const vaults = useSelector(selectAllVaults);
    const primaryVault = useSelector(selectPrimaryVault);
    const { vaultLimit, vaultTotalCount } = useSelector(selectVaultLimits);
    const plan = useSelector(selectPassPlan);

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

    const form = useFormik<VaultsPickerFormValues>({
        onSubmit: handleSubmit,
        initialValues: {
            vaults: payload.vaults.map(
                (vault): VaultPickerValue => ({
                    ...vault,
                    shareId: primaryVault.shareId,
                    name: primaryVault.content.name,
                    selected: true,
                })
            ),
        },
    });

    const vaultsToCreate = useMemo(
        () => form.values.vaults.filter((vault) => vault.shareId === null).length,
        [form.values]
    );

    const vaultsRemaining = vaultLimit - vaultTotalCount - vaultsToCreate;
    const canCreateVault = vaultsRemaining > 0;

    return (
        <ModalTwo open onClose={onClose} onReset={onReset} size={'medium'} className="mt-10">
            <ModalTwoHeader title={c('Title').t`Import to vaults`} />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Card rounded className="mb-4 text-sm">
                            {c('Info').t`Select the destination vault for each imported vault.`}

                            {vaultsRemaining <= 0 && (
                                <>
                                    <hr className="mt-2 mb-2" />
                                    {plan === UserPassPlan.FREE ? (
                                        <>
                                            {c('Warning')
                                                .t`Your subscription does not allow you to create multiple vaults. All items will be imported to your primary vault. To import into multiple vaults upgrade your subscription.`}
                                            <UpgradeButton inline className="ml-1" />
                                        </>
                                    ) : (
                                        c('Warning').t`You cannot create more vaults than your subscription allows.`
                                    )}
                                </>
                            )}
                        </Card>

                        {payload.vaults.map((importedVault, idx) => {
                            const value = form.values.vaults[idx];
                            const { selected } = value;

                            return (
                                <Card
                                    key={`import-vault-${idx}`}
                                    background={!selected}
                                    style={{ opacity: selected ? 1 : 0.5 }}
                                    className="mb-3"
                                    rounded
                                >
                                    <ImportVaultPickerOption
                                        data={importedVault}
                                        vaults={vaults}
                                        allowNewVault={canCreateVault}
                                        value={value.shareId}
                                        selected={value.selected}
                                        onToggle={(checked) =>
                                            form.setFieldValue(
                                                'vaults',
                                                form.values.vaults.map((vault, j) => ({
                                                    ...vault,
                                                    selected: j === idx ? checked : vault.selected,
                                                }))
                                            )
                                        }
                                        onChange={async (shareId) =>
                                            form.setFieldValue(
                                                'vaults',
                                                form.values.vaults.map((vault, j): VaultPickerValue => {
                                                    if (idx !== j) return vault;
                                                    return { ...importedVault, selected: true, shareId };
                                                })
                                            )
                                        }
                                    />
                                </Card>
                            );
                        })}
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose} color="danger">
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" color="norm" disabled={vaultsRemaining < 0} form={FORM_ID}>{c('Action')
                    .t`Proceed`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
