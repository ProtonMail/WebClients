import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { deleteMember } from '@proton/shared/lib/api/members';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { FAMILY_PLAN_INVITE_STATE, Member, Organization } from '@proton/shared/lib/interfaces';

import { ModalProps, Prompt } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends ModalProps {
    member: Member;
    organization: Organization;
}

const UserRemoveModal = ({ member, organization, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const isInvitationPending = !!(member.State === FAMILY_PLAN_INVITE_STATE.STATUS_INVITED);

    const handleClose = () => {
        if (submitting) {
            return undefined;
        }
        rest?.onClose?.();
    };

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
            text: c('familyOffer_2023:Success').t`${member.Name} has been removed from ${organization.Name}`,
        });
    };

    const description = isInvitationPending
        ? // translator: Info message when a user has been invited to an organization. Looks like: 'The invitation will be cancelled and the user won't be able to join Bernie's Family.'
          c('familyOffer_2023:Info')
              .t`The invitation will be cancelled and the user won't be able to join ${organization.Name}.`
        : c('familyOffer_2023:Info')
              .t`The user's account will be moved to a ${BRAND_NAME} Unlimited plan for a 30-day free trial*.`;

    return (
        <Prompt
            {...rest}
            title={c('Title').t`Remove user?`}
            footnote={isInvitationPending ? undefined : c('familyOffer_2023:Info').t`*Only one free trial per user.`}
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
