import { Fragment } from 'react';

import { Avatar } from '@proton/atoms/Avatar';
import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { useUser } from '@proton/components/hooks';
import { SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { ShareInvitation, ShareMember } from '../../../../store';

interface Props {
    members: ShareMember[];
    invitations: ShareInvitation[];
    isLoading: boolean;
}

const DirectSharingListing = ({ members, invitations, isLoading }: Props) => {
    const { contactEmailsMap } = useContactEmailsCache();
    const [user] = useUser();

    if (isLoading) {
        return <CircleLoader size="medium" className="mx-auto my-6 w-full" />;
    }
    if (!members.length && !invitations.length) {
        return (
            <div className={'flex items-center my-4'}>
                <Avatar color="weak" className="mr-2">
                    {getInitials(user.DisplayName)}
                </Avatar>
                <p className="flex flex-column p-0 m-0">
                    <span className="text-semibold">{user.DisplayName}</span>
                    <span className="color-weak">{user.Email}</span>
                </p>
            </div>
        );
    }
    return (
        <>
            {members.map(({ email, memberId, permissions }) => {
                const { Name: contactName, Email: contactEmail } = contactEmailsMap[
                    canonicalizeInternalEmail(email)
                ] || {
                    Name: '',
                    Email: email,
                };
                return (
                    <Fragment key={memberId}>
                        <div className={'flex items-center my-4'}>
                            <Avatar color="weak" className="mr-2">
                                {getInitials(contactName || contactEmail)}
                            </Avatar>
                            <p className="flex flex-column p-0 m-0">
                                <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                                {contactName && <span className="color-weak">{contactEmail}</span>}
                            </p>
                        </div>
                        <div>Permissions: {permissions}</div>
                    </Fragment>
                );
            })}
            {invitations.map(({ inviteeEmail, invitationId, permissions, state }) => {
                const { Name: contactName, Email: contactEmail } = contactEmailsMap[
                    canonicalizeInternalEmail(inviteeEmail)
                ] || {
                    Name: '',
                    Email: inviteeEmail,
                };
                return (
                    <Fragment key={invitationId}>
                        <div className={'flex items-center my-4'}>
                            <Avatar color="weak" className="mr-2">
                                {getInitials(contactName || contactEmail)}
                            </Avatar>
                            <p className="flex flex-column p-0 m-0">
                                <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                                {contactName && <span className="color-weak">{contactEmail}</span>}
                            </p>
                        </div>
                        {/*// TODO: This component bellow is fully temporary for testing purpose*/}
                        <Button size="small" shape="ghost" disabled={state === SHARE_MEMBER_STATE.PENDING}>
                            Permissions: {permissions}
                            State: {state}
                        </Button>
                    </Fragment>
                );
            })}
        </>
    );
};

export default DirectSharingListing;
