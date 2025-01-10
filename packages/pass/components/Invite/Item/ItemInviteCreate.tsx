import { type FC, type ReactNode, useEffect, useRef } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type IconName } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useInviteAddressesValidator } from '@proton/pass/hooks/useInviteAddressesValidator';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import { validateInvite } from '@proton/pass/lib/validation/invite';
import {
    type inviteBatchCreateFailure,
    inviteBatchCreateIntent,
    type inviteBatchCreateSuccess,
} from '@proton/pass/store/actions';
import { type Callback, type ItemInviteFormValues, type SelectedItem, ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { FORM_ID, ItemInviteForm } from './ItemInviteForm';

export const ItemInviteCreate: FC<SelectedItem> = ({ shareId, itemId }) => {
    const { close, manageItemAccess } = useInviteActions();
    const validator = useInviteAddressesValidator(shareId ?? '');
    const emailFieldRef = useRef<HTMLInputElement>(null);

    const createInvite = useActionRequest<
        typeof inviteBatchCreateIntent,
        typeof inviteBatchCreateSuccess,
        typeof inviteBatchCreateFailure
    >(inviteBatchCreateIntent, {
        onSuccess: ({ shareId, itemId }) => manageItemAccess(shareId, itemId!),
    });

    const form = useFormik<ItemInviteFormValues>({
        initialValues: {
            step: 'members',
            members: [],
            shareId,
            itemId,
            shareType: ShareType.Item,
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
    }, [form.values.members, validator]);

    const attributes = ((): {
        submitText: string;
        closeAction: Callback;
        closeLabel: string;
        closeIcon: IconName;
    } => {
        const submitText = c('Action').t`Send invite`;

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
                            <ItemInviteForm
                                autoFocus={didEnter}
                                form={form}
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
