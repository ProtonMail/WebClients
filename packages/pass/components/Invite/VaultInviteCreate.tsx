import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type IconName } from '@proton/components/components';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useValidateInviteAddresses } from '@proton/pass/hooks/useValidateInviteAddress';
import { validateShareInviteValues } from '@proton/pass/lib/validation/vault-invite';
import {
    type inviteBatchCreateFailure,
    inviteBatchCreateIntent,
    type inviteBatchCreateSuccess,
} from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { selectDefaultVault } from '@proton/pass/store/selectors';
import { BitField, type Callback, type InviteFormValues, type SelectedItem } from '@proton/pass/types';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import noop from '@proton/utils/noop';

import { useInviteContext } from './InviteContext';
import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

export type VaultInviteCreateProps =
    | { withVaultCreation: false; vault: VaultShareItem }
    | { withVaultCreation: true; item?: SelectedItem; onVaultCreated?: (shareId: string) => void };

export type VaultInviteCreateValues<T extends boolean = boolean> = Omit<
    Extract<VaultInviteCreateProps, { withVaultCreation: T }>,
    'withVaultCreation' | 'onVaultCreated'
>;

export const VaultInviteCreate: FC<VaultInviteCreateProps> = (props) => {
    const { close, manageAccess } = useInviteContext();
    const org = useOrganization({ sync: true });

    const defaultShareId = useSelector(selectDefaultVault).shareId;
    const shareId = props.withVaultCreation ? defaultShareId : props.vault.shareId;
    const addressValidator = useValidateInviteAddresses(shareId);
    const validateAddresses = !org?.b2bAdmin && org?.settings.ShareMode === BitField.ACTIVE;
    const emailFieldRef = useRef<HTMLInputElement>(null);

    const createInvite = useActionRequest<
        typeof inviteBatchCreateIntent,
        typeof inviteBatchCreateSuccess,
        typeof inviteBatchCreateFailure
    >(inviteBatchCreateIntent, {
        onSuccess: (req) => {
            const { shareId } = req.data;
            if (props.withVaultCreation) props.onVaultCreated?.(shareId);
            manageAccess(shareId);
        },
    });

    const form = useFormik<InviteFormValues>({
        initialValues: {
            step: 'members',
            members: [],
            ...(props.withVaultCreation
                ? {
                      color: VaultColor.COLOR3,
                      description: '',
                      icon: VaultIcon.ICON9,
                      item: props.item,
                      name: c('Placeholder').t`Shared vault`,
                      withVaultCreation: true,
                  }
                : {
                      color: props.vault.content.display.color ?? VaultColor.COLOR_UNSPECIFIED,
                      description: '',
                      icon: props.vault.content.display.icon ?? VaultIcon.ICON_UNSPECIFIED,
                      name: props.vault.content.name,
                      shareId: props.vault.shareId,
                      withVaultCreation: false,
                  }),
        },
        initialErrors: { members: [] },
        validateOnChange: true,
        validate: validateShareInviteValues({
            emailField: emailFieldRef,
            validateAddresses,
            validationMap: addressValidator.emails,
        }),
        onSubmit: (values, { setFieldValue }) => {
            if (addressValidator.loading) return;

            switch (values.step) {
                case 'members':
                    return setFieldValue('step', 'permissions');
                case 'vault':
                    return setFieldValue('step', 'members');
                case 'permissions':
                    return setFieldValue('step', 'review');
                case 'review':
                    createInvite.dispatch(values);
                    break;
            }
        },
    });

    useEffect(() => {
        if (validateAddresses) {
            addressValidator
                .validate(form.values.members.map(({ value }) => value.email))
                .then(() => form.validateForm())
                .catch(noop);
        }
    }, [form.values.members, validateAddresses]);

    const attributes = ((): {
        submitText: string;
        closeAction: Callback;
        closeLabel: string;
        closeIcon: IconName;
    } => {
        const sharedVault = !props.withVaultCreation && props.vault.shared;
        const submitText = sharedVault ? c('Action').t`Send invite` : c('Action').t`Share vault`;

        switch (form.values.step) {
            case 'vault':
                return {
                    closeAction: () => form.setFieldValue('step', 'members'),
                    closeIcon: 'chevron-left',
                    closeLabel: c('Action').t`Back`,
                    submitText: c('Action').t`Update vault`,
                };
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
                    className="pass-panel--full"
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
                                    disabled={createInvite.loading || addressValidator.loading || !form.isValid}
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
                                addressValidator={addressValidator}
                            />
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
