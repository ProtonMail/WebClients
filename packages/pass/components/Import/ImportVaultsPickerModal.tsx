import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { UpsellRef } from '@proton/pass/constants';
import { type ImportPayload, type ImportVault } from '@proton/pass/lib/import/types';
import {
    selectDefaultVault,
    selectPassPlan,
    selectVaultLimits,
    selectWritableVaults,
} from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { omit } from '@proton/shared/lib/helpers/object';

import { UpgradeButton } from '../Layout/Button/UpgradeButton';
import { ImportVaultPickerOption } from './ImportVaultsPickerOption';

type VaultPickerValue = ImportVault & { selected: boolean };
type VaultsPickerFormValues = { vaults: VaultPickerValue[] };
type ImportVaultsPickerProps = Omit<ModalProps, 'onSubmit'> & {
    payload: ImportPayload;
    onSubmit: (payload: ImportPayload) => void;
};
export type ImportVaultsPickerHandle = { submit: () => void };

const FORM_ID = 'vault-picker';

export const ImportVaultsPickerModal: FC<ImportVaultsPickerProps> = ({ payload, onClose, onReset, onSubmit }) => {
    const writableVaults = useSelector(selectWritableVaults);
    const defaultVault = useSelector(selectDefaultVault);
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
                    shareId: defaultVault.shareId,
                    name: defaultVault.content.name,
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
            <ModalTwoHeader
                title={
                    // translator: this is generic title of the modal where user can select 1 or more vaults to do the import (the number is not determined and title is not changeable)
                    c('Title').t`Import to vault(s)`
                }
            />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Card rounded className="mb-4 text-sm">
                            {
                                // translator: this is generic instruction message in import modal suggesting that user may select one or more vaults
                                c('Info').t`Select where you want your imported vault(s) to be saved.`
                            }

                            {vaultsRemaining <= 0 && (
                                <>
                                    <hr className="mt-2 mb-2" />
                                    {plan === UserPassPlan.FREE ? (
                                        <>
                                            {c('Warning')
                                                .t`Your subscription does not allow you to create multiple vaults. All items will be imported to your first vault. To import into multiple vaults upgrade your subscription.`}
                                            <UpgradeButton inline className="ml-1" upsellRef={UpsellRef.LIMIT_IMPORT} />
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
                                        vaults={writableVaults}
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
                <Button type="submit" color="norm" form={FORM_ID}>{c('Action').t`Confirm`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
