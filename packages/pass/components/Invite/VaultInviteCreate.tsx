import type { FC, ReactNode } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type IconName } from '@proton/components/components';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import type { RequestEntryFromAction } from '@proton/pass/hooks/useActionRequest';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateShareInviteValues } from '@proton/pass/lib/validation/vault-invite';
import type { inviteCreationSuccess } from '@proton/pass/store/actions';
import { inviteCreationIntent } from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { Callback, InviteFormValues, SelectedItem } from '@proton/pass/types';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';

import { useInviteContext } from './InviteProvider';
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

    const createInvite = useActionRequest({
        action: inviteCreationIntent,
        onSuccess: (req: RequestEntryFromAction<ReturnType<typeof inviteCreationSuccess>>) => {
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
        validateOnChange: true,
        validate: validateShareInviteValues,
        onSubmit: (values, { setFieldValue }) => {
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

    const attributes = ((): {
        submitText: string;
        closeAction: Callback;
        closeLabel: string;
        closeIcon: IconName;
    } => {
        const sharedVault = !props.withVaultCreation && props.vault.shared;
        const submitText = sharedVault ? c('Action').t`Send invite` : c('Action').t`Share vault`;

        switch (form.values.step) {
            case 'members':
                return {
                    closeAction: close,
                    closeIcon: 'cross-big',
                    closeLabel: c('Action').t`Close`,
                    submitText: c('Action').t`Continue`,
                };
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
                                    disabled={createInvite.loading || !form.isValid || !form.dirty}
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
                        <Form id={FORM_ID}>
                            <VaultInviteForm form={form} autoFocus={didEnter} />
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
