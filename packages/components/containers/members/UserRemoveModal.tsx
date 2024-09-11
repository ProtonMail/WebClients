import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { deleteMember } from '@proton/shared/lib/api/members';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Member, Organization } from '@proton/shared/lib/interfaces';
import { MEMBER_STATE } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../components';
import { Prompt } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends ModalProps {
    member: Member | undefined;
    organization?: Organization;
}

const UserRemoveModal = ({ member: initialMember, organization, ...rest }: Props) => {
    const api = useApi();
    const [member] = useState(initialMember!);
    const { call } = useEventManager();
    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const isInvitationPending = !!(member.State === MEMBER_STATE.STATUS_INVITED);

    const handleClose = () => {
        if (submitting) {
            return undefined;
        }
        rest?.onClose?.();
    };

    const organizationName = organization?.Name || '';
    const handleDelete = async () => {
        if (!member?.ID) {
            createNotification({
                text: c('familyOffer_2023:Success').t`An error occurred, please try again`,
                type: 'error',
            });
            return;
        }

        await api(deleteMember(member?.ID));
        await call();
        rest?.onClose?.();
        createNotification({
            // translator: Success message when a user has been removed from an organization. Looks like: 'John Doe has been removed from Bernie's Family'
            text: c('familyOffer_2023:Success').t`${member.Name} has been removed from ${organizationName}`,
        });
    };

    const description = isInvitationPending
        ? // translator: Info message when a user has been invited to an organization. Looks like: 'The invitation will be canceled and the user won't be able to join Bernie's Family.'
          c('familyOffer_2023:Info')
              .t`The invitation will be canceled and the user won't be able to join ${organizationName}.`
        : c('familyOffer_2023:Info')
              .t`After leaving your plan, this user will be moved to a ${BRAND_NAME} Unlimited plan with a 30-day free trial.*`;

    return (
        <Prompt
            {...rest}
            title={c('Title').t`Remove user?`}
            footnote={
                isInvitationPending
                    ? undefined
                    : c('familyOffer_2023:Info').t`*Only one free trial per user. Regular pricing applies thereafter.`
            }
            buttons={[
                <Button
                    color="danger"
                    loading={submitting}
                    onClick={() => {
                        void withLoading(handleDelete);
                    }}
                >{c('Action').t`Remove`}</Button>,
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>{description}</p>
        </Prompt>
    );
};

export default UserRemoveModal;
