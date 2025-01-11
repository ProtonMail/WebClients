import type { ReactNode } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { ShareMember } from '@proton/pass/components/Share/ShareMember';
import { PendingExistingMember, PendingNewMember } from '@proton/pass/components/Share/SharePendingMember';
import type { SelectAccessDTO } from '@proton/pass/store/selectors';
import type { NewUserPendingInvite, PendingInvite } from '@proton/pass/types';
import { type ShareMember as ShareMemberType } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

export type InviteListItem =
    | { key: string; type: 'existing'; invite: PendingInvite }
    | { key: string; type: 'new'; invite: NewUserPendingInvite };

type Props = SelectAccessDTO & {
    canManage: boolean;
    canTransfer: boolean;
    className?: string;
    heading?: ReactNode;
    invites?: InviteListItem[];
    members?: ShareMemberType[];
    title?: ReactNode;
    onInvite?: () => void;
};

export const AccessList: FC<Props> = ({
    canManage,
    canTransfer,
    className,
    heading,
    invites,
    itemId,
    members,
    shareId,
    title,
    onInvite,
}) => {
    return (
        <div className={clsx('flex flex-column gap-y-3', className)}>
            {title && <div className="color-weak text-sm">{title}</div>}

            <FieldsetCluster mode="read" as="div">
                {heading && <div className="px-4">{heading}</div>}

                {onInvite && (
                    <div>
                        <Button
                            color="norm"
                            shape="ghost"
                            className="w-full text-left"
                            onClick={onInvite}
                            disabled={!canManage}
                        >
                            <Icon name="users-plus" className="mr-4" />
                            {c('Action').t`Invite more...`}
                        </Button>
                    </div>
                )}

                {invites?.map((item) => {
                    switch (item.type) {
                        case 'new':
                            return (
                                <PendingNewMember
                                    shareId={shareId}
                                    key={item.key}
                                    email={item.invite.invitedEmail}
                                    newUserInviteId={item.invite.newUserInviteId}
                                    canManage={canManage}
                                    state={item.invite.state}
                                    itemId={itemId}
                                    className="rounded-none"
                                />
                            );
                        case 'existing':
                            return (
                                <PendingExistingMember
                                    key={item.key}
                                    shareId={shareId}
                                    email={item.invite.invitedEmail}
                                    inviteId={item.invite.inviteId}
                                    canManage={canManage}
                                    itemId={itemId}
                                    className="rounded-none"
                                />
                            );
                    }
                })}

                {members?.map((member) => (
                    <ShareMember
                        key={member.email}
                        email={member.email}
                        shareId={shareId}
                        userShareId={member.shareId}
                        me={shareId === member.shareId}
                        owner={member.owner}
                        role={member.shareRoleId}
                        canManage={canManage}
                        canTransfer={canTransfer}
                        itemId={itemId}
                        className="rounded-none"
                    />
                ))}
            </FieldsetCluster>
        </div>
    );
};
