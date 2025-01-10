import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type IconName } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useInviteAddressesValidator } from '@proton/pass/hooks/useInviteAddressesValidator';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import { validateInvite } from '@proton/pass/lib/validation/invite';
import {
    type inviteBatchCreateFailure,
    inviteBatchCreateIntent,
    type inviteBatchCreateSuccess,
} from '@proton/pass/store/actions';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { SelectedShare } from '@proton/pass/types';
import { BitField, type Callback, ShareType, type VaultInviteFormValues } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

export const VaultInviteCreate: FC<SelectedShare> = ({ shareId }) => {
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const { close, manageVaultAccess } = useInviteActions();
    const org = useOrganization({ sync: true });
    const validator = useInviteAddressesValidator(shareId);
    const validateAddresses = !org?.b2bAdmin && org?.settings.ShareMode === BitField.ACTIVE;
    const emailFieldRef = useRef<HTMLInputElement>(null);

    const createInvite = useActionRequest<
        typeof inviteBatchCreateIntent,
        typeof inviteBatchCreateSuccess,
        typeof inviteBatchCreateFailure
    >(inviteBatchCreateIntent, {
        onSuccess: ({ shareId }) => manageVaultAccess(shareId),
    });

    const form = useFormik<VaultInviteFormValues>({
        initialValues: {
            step: 'members',
            members: [],
            shareType: ShareType.Vault,
            shareId: vault.shareId,
        },
        initialErrors: { members: [] },
        validateOnChange: true,
        validate: validateInvite({
            emailField: emailFieldRef,
            emailValidationResults: validator?.emails,
        }),
        onSubmit: (values, { setFieldValue }) => {
            if (validator?.loading) return;

            switch (values.step) {
                case 'members':
                    return setFieldValue('step', 'permissions');
                case 'permissions':
                    return setFieldValue('step', 'review');
                case 'review':
                    createInvite.dispatch(values);
                    break;
            }
        },
    });

    useEffect(() => {
        validator
            ?.validate(form.values.members.map(({ value }) => value.email))
            .then(() => form.validateForm())
            .catch(noop);
    }, [form.values.members, validateAddresses]);

    const attributes = ((): {
        submitText: string;
        closeAction: Callback;
        closeLabel: string;
        closeIcon: IconName;
    } => {
        const submitText = vault.shared ? c('Action').t`Send invite` : c('Action').t`Share vault`;

        switch (form.values.step) {
            case 'permissions':
                return {
                    closeAction: () => form.setFieldValue('step', 'members'),
                    closeIcon: 'chevron-left',
                    closeLabel: c('Action').t`Back`,
                    submitText,
                };
            case 'review':
                return {
                    closeAction: () => form.setFieldValue('step', 'permissions'),
                    closeIcon: 'chevron-left',
                    closeLabel: c('Action').t`Back`,
                    submitText,
                };
            case 'members':
                return {
                    closeAction: close,
                    closeIcon: 'cross-big',
                    closeLabel: c('Action').t`Close`,
                    submitText: c('Action').t`Continue`,
                };
        }
    })();

    return (
        <SidebarModal onClose={close} open>
            {(didEnter): ReactNode => (
                <Panel
                    loading={createInvite.loading}
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    className="shrink-0"
                                    disabled={form.values.step === 'review' && createInvite.loading}
                                    icon
                                    key="modal-close-button"
                                    onClick={attributes.closeAction}
                                    pill
                                    shape="solid"
                                >
                                    <Icon
                                        className="modal-close-icon"
                                        name={attributes.closeIcon}
                                        alt={attributes.closeLabel}
                                    />
                                </Button>,
                                <Button
                                    color="norm"
                                    disabled={createInvite.loading || validator?.loading || !form.isValid}
                                    form={FORM_ID}
                                    key="modal-submit-button"
                                    loading={createInvite.loading}
                                    pill
                                    type="submit"
                                >
                                    {attributes.submitText}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="flex-1">
                            <VaultInviteForm
                                form={form}
                                autoFocus={didEnter}
                                ref={emailFieldRef}
                                validator={validator}
                            />
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
