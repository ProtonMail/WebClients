import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalProps } from '@proton/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { UpsellRef } from '@proton/pass/constants';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import { type vaultCreationFailure, vaultCreationIntent, type vaultCreationSuccess } from '@proton/pass/store/actions';
import { selectPassPlan, selectVaultLimits } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import noop from '@proton/utils/noop';

import { VaultForm, type VaultFormValues } from './Vault.form';

type Props = Omit<ModalProps, 'onSubmit'> & { onSuccess: (shareId: string) => void };
const FORM_ID = 'vault-create';

export const VaultNew: FC<Props> = ({ onSuccess, ...modalProps }) => {
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const createVault = useActionRequest<
        typeof vaultCreationIntent,
        typeof vaultCreationSuccess,
        typeof vaultCreationFailure
    >(vaultCreationIntent, {
        onSuccess: ({ data }) => onSuccess?.(data.share.shareId),
    });

    const form = useFormik<VaultFormValues>({
        initialValues: {
            name: '',
            description: '',
            color: VaultColor.COLOR1,
            icon: VaultIcon.ICON1,
        },
        validateOnChange: true,
        validate: validateVaultValues,
        onSubmit: ({ name, description, color, icon }) => {
            createVault.dispatch({
                content: {
                    name,
                    description,
                    display: { color, icon },
                },
            });
        },
    });

    useEffect(() => form.resetForm(), [modalProps.open]);

    return (
        <SidebarModal {...modalProps} open onBackdropClick={noop} disableCloseOnEscape>
            {(didEnter) => (
                <Panel
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    key="modal-close-button"
                                    className="shrink-0"
                                    icon
                                    pill
                                    shape="solid"
                                    onClick={modalProps.onClose}
                                    disabled={createVault.loading}
                                >
                                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                                </Button>,

                                vaultLimitReached && isFreePlan ? (
                                    <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.LIMIT_VAULT} />
                                ) : (
                                    <Button
                                        key="modal-submit-button"
                                        type="submit"
                                        form={FORM_ID}
                                        color="norm"
                                        pill
                                        loading={createVault.loading}
                                        disabled={!form.isValid || createVault.loading || vaultLimitReached}
                                    >
                                        {createVault.loading
                                            ? c('Action').t`Creating vault`
                                            : c('Action').t`Create vault`}
                                    </Button>
                                ),
                            ]}
                        />
                    }
                >
                    <>
                        {vaultLimitReached && (
                            <Card className="mb-4 text-sm" type="primary">
                                {c('Info').t`You have reached the limit of vaults you can create.`}
                                {isFreePlan && c('Info').t` Upgrade to a paid plan to create multiple vaults.`}
                            </Card>
                        )}
                        <FormikProvider value={form}>
                            <Form id={FORM_ID} className="flex flex-column gap-y-4">
                                <VaultForm form={form} autoFocus={didEnter} disabled={createVault.loading} />
                            </Form>
                        </FormikProvider>
                    </>
                </Panel>
            )}
        </SidebarModal>
    );
};
