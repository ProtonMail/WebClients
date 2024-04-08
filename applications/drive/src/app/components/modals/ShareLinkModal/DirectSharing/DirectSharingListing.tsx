import { Fragment } from 'react';

import { Avatar, CircleLoader } from '@proton/atoms';
import { useContactEmails, useUser } from '@proton/components/hooks';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { ShareInvitation, ShareMember } from '../../../../store';
import { DirectSharingListInvitation } from './DirectSharingListInvitation';

interface Props {
    volumeId?: string;
    linkId: string;
    members: ShareMember[];
    invitations: ShareInvitation[];
    isLoading: boolean;
}

const DirectSharingListing = ({ volumeId, linkId, members, invitations, isLoading }: Props) => {
    const [contactEmails] = useContactEmails();

    const [user] = useUser();

    const getContactNameAndEmail = (email: string) => {
        const { Name: contactName, Email: contactEmail } = contactEmails?.find(
            (contactEmail) => contactEmail.Email === canonicalizeInternalEmail(email)
        ) || {
            Name: '',
            Email: email,
        };

        return {
            contactName,
            contactEmail,
        };
    };

    if (isLoading) {
        return <CircleLoader size="medium" className="mx-auto my-6 w-full" />;
    }
    if ((!members.length && !invitations.length) || !volumeId) {
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
                const { Name: contactName, Email: contactEmail } = contactEmails?.find(
                    (contactEmail) => contactEmail.Email === canonicalizeInternalEmail(email)
                ) || {
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

            <ul className="unstyled">
                {invitations.map((invitation) => {
                    const { contactName, contactEmail } = getContactNameAndEmail(invitation.inviteeEmail);
                    return (
                        <DirectSharingListInvitation
                            key={invitation.invitationId}
                            invitationId={invitation.invitationId}
                            volumeId={volumeId}
                            linkId={linkId}
                            contactName={contactName}
                            contactEmail={contactEmail}
                        />
                    );
                })}
            </ul>
        </>
    );
};

export default DirectSharingListing;
