import { type FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { FadeIn } from '@proton/pass/components/Layout/Animation/FadeIn';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { SharedVaultItem } from '@proton/pass/components/Vault/SharedVaultItem';
import type { RequestEntryFromAction } from '@proton/pass/hooks/useActionRequest';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateShareInviteValues } from '@proton/pass/lib/validation/vault-invite';
import type { inviteCreationSuccess } from '@proton/pass/store/actions';
import { inviteCreationIntent } from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { InviteFormValues, SelectedItem } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { useInviteContext } from './InviteContextProvider';
import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

export type VaultInviteCreateProps =
    | { withVaultCreation: false; vault: VaultShareItem }
    | { withVaultCreation: true; item: SelectedItem; onVaultCreated?: (shareId: string) => void };

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
            step: 'email',
            email: '',
            role: ShareRole.READ,
            ...(props.withVaultCreation
                ? {
                      withVaultCreation: true,
                      name: c('Placeholder').t`Shared vault`,
                      description: '',
                      color: VaultColor.COLOR3,
                      icon: VaultIcon.ICON9,
                      item: props.item,
                  }
                : { withVaultCreation: false, shareId: props.vault.shareId }),
        },
        validateOnChange: true,
        validate: validateShareInviteValues,
        onSubmit: (values, { setFieldValue }) => {
            switch (values.step) {
                case 'email':
                    return setFieldValue('step', 'permissions');
                case 'vault':
                    return setFieldValue('step', 'email');
                case 'permissions':
                    createInvite.dispatch(values);
                    break;
            }
        },
    });

    const submitText = (() => {
        switch (form.values.step) {
            case 'email':
                return c('Action').t`Continue`;
            case 'vault':
                return c('Action').t`Update vault`;
            case 'permissions':
                return !props.withVaultCreation && props.vault.shared
                    ? c('Action').t`Send invite`
                    : c('Action').t`Share vault`;
        }
    })();

    return (
        <SidebarModal onClose={close} open>
            {(didEnter) => (
                <Panel
                    loading={createInvite.loading}
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    className="flex-item-noshrink"
                                    icon
                                    key="modal-close-button"
                                    onClick={close}
                                    pill
                                    shape="solid"
                                >
                                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
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
                                    {submitText}
                                </Button>,
                            ]}
                        />
                    }
                >
                    {form.values.step !== 'vault' && (
                        <FadeIn
                            className={clsx(
                                'flex flex-justify-space-between flex-align-items-center flex-nowrap mt-3 mb-6 gap-3',
                                props.withVaultCreation && 'border rounded-xl p-3'
                            )}
                        >
                            {form.values.withVaultCreation && (
                                <>
                                    <SharedVaultItem
                                        color={form.values.color}
                                        icon={form.values.icon}
                                        name={form.values.name}
                                    />
                                    <Button
                                        className="flex-item-noshrink"
                                        color="weak"
                                        onClick={() => form.setFieldValue('step', 'vault')}
                                        pill
                                        shape="solid"
                                    >
                                        {c('Action').t`Customize`}
                                    </Button>
                                </>
                            )}

                            {!props.withVaultCreation && (
                                <SharedVaultItem
                                    color={props.vault.content.display.color}
                                    icon={props.vault.content.display.icon}
                                    name={props.vault.content.name}
                                    shareId={props.vault.shareId}
                                />
                            )}
                        </FadeIn>
                    )}

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
