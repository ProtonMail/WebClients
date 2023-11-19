import { type VFC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type ModalProps } from '@proton/components/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { type RequestEntryFromAction, useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import type { vaultCreationSuccess } from '@proton/pass/store/actions';
import { vaultCreationIntent } from '@proton/pass/store/actions';
import { selectPassPlan, selectVaultLimits } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import noop from '@proton/utils/noop';

import { VaultForm, type VaultFormValues } from './Vault.form';

type Props = Omit<ModalProps, 'onSubmit'> & { onSuccess: (shareId: string) => void };
const FORM_ID = 'vault-create';

export const VaultNew: VFC<Props> = ({ onSuccess, ...modalProps }) => {
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const passPlan = useSelector(selectPassPlan);

    const createVault = useActionRequest({
        action: vaultCreationIntent,
        onSuccess: (req: RequestEntryFromAction<ReturnType<typeof vaultCreationSuccess>>) =>
            onSuccess?.(req.data.shareId),
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
                                    className="flex-item-noshrink"
                                    icon
                                    pill
                                    shape="solid"
                                    onClick={modalProps.onClose}
                                    disabled={createVault.loading}
                                >
                                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                                </Button>,

                                !vaultLimitReached ? (
                                    <Button
                                        key="modal-submit-button"
                                        type="submit"
                                        form={FORM_ID}
                                        color="norm"
                                        pill
                                        loading={createVault.loading}
                                        disabled={!form.isValid || createVault.loading}
                                    >
                                        {createVault.loading
                                            ? c('Action').t`Creating vault`
                                            : c('Action').t`Create vault`}
                                    </Button>
                                ) : (
                                    <UpgradeButton key="upgrade-button" />
                                ),
                            ]}
                        />
                    }
                >
                    <>
                        {vaultLimitReached && (
                            <Card className="mb-4">
                                {c('Info').t`You have reached the limit of vaults you can create.`}
                                {passPlan === UserPassPlan.FREE &&
                                    c('Info').t` Upgrade to a paid plan to create multiple vaults.`}
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
