import { Fragment, useRef } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon } from '@proton/components/components';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { useUser } from '@proton/components/hooks';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { ShareInvitation, ShareMember } from '../../../../store';
import { useContextMenuControls } from '../../../FileBrowser';
import { ShareInvitationContextMenu } from '../../../sharing/ShareInvitationContextMenu';

interface Props {
    volumeId?: string;
    linkId: string;
    members: ShareMember[];
    invitations: ShareInvitation[];
    isLoading: boolean;
}

const DirectSharingListing = ({ volumeId, linkId, members, invitations, isLoading }: Props) => {
    const { contactEmailsMap } = useContactEmailsCache();
    const ref = useRef<HTMLButtonElement>(null);
    const contextMenuControls = useContextMenuControls();
    const [user] = useUser();

    if (isLoading || !volumeId) {
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

            <ul className="unstyled">
                {invitations.map((invitation) => {
                    const { inviteeEmail, invitationId } = invitation;
                    const { Name: contactName, Email: contactEmail } = contactEmailsMap[
                        canonicalizeInternalEmail(inviteeEmail)
                    ] || {
                        Name: '',
                        Email: inviteeEmail,
                    };
                    return (
                        <Fragment key={invitationId}>
                            <ShareInvitationContextMenu
                                anchorRef={ref}
                                isOpen={contextMenuControls.isOpen}
                                position={contextMenuControls.position}
                                open={contextMenuControls.open}
                                close={contextMenuControls.close}
                                volumeId={volumeId}
                                linkId={linkId}
                                invitation={invitation}
                            />
                            <li className="flex items-center">
                                <div className={'flex items-center my-4'}>
                                    <Avatar color="weak" className="mr-2">
                                        {getInitials(contactName || contactEmail)}
                                    </Avatar>
                                    <p className="flex flex-column p-0 m-0">
                                        <span className="text-semibold">
                                            {contactName ? contactName : contactEmail}
                                        </span>
                                        {contactName && <span className="color-weak">{contactEmail}</span>}
                                    </p>
                                </div>
                                {/*// TODO: This component bellow is fully temporary for testing purpose*/}

                                <Button
                                    className="ml-auto"
                                    ref={ref}
                                    shape="ghost"
                                    size="small"
                                    icon
                                    onClick={(e) => {
                                        contextMenuControls.handleContextMenu(e);
                                    }}
                                    onTouchEnd={(e) => {
                                        contextMenuControls.handleContextMenuTouch(e);
                                    }}
                                >
                                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                                </Button>
                            </li>
                        </Fragment>
                    );
                })}
            </ul>
        </>
    );
};

export default DirectSharingListing;
