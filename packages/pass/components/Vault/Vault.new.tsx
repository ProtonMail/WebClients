import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import noop from '@proton/utils/noop';

import { UpsellRef } from '../../constants';
import { useActionRequest } from '../../hooks/useRequest';
import { validateVaultValues } from '../../lib/validation/vault';
import { type vaultCreationFailure, vaultCreationIntent, type vaultCreationSuccess } from '../../store/actions';
import { selectPassPlan, selectVaultLimits } from '../../store/selectors';
import { UserPassPlan } from '../../types/api/plan';
import { VaultColor, VaultIcon } from '../../types/protobuf/vault-v1.static';
import { Card } from '../Layout/Card/Card';
import { SidebarModal } from '../Layout/Modal/SidebarModal';
import { Panel } from '../Layout/Panel/Panel';
import { PanelHeader } from '../Layout/Panel/PanelHeader';
import { UpgradeButton } from '../Upsell/UpgradeButton';
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
    >(vaultCreationIntent, { onSuccess: ({ share }) => onSuccess?.(share.shareId) });

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
                                    <IcCrossBig className="modal-close-icon" alt={c('Action').t`Close`} />
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
                                {isFreePlan && <> {c('Info').t`Upgrade to a paid plan to create multiple vaults.`}</>}
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
