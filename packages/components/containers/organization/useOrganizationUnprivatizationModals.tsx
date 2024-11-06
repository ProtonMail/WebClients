import type { ReactNode} from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import { deleteMembers } from '@proton/account/members/actions';
import { selectDisabledMembers } from '@proton/account/members/selectors';
import {
    selectJoinedUnprivatizationState,
    unprivatizeApprovalMembers,
    unprivatizeMembersBackground,
} from '@proton/account/members/unprivatizeMembers';
import { Button, Card, InlineLinkButton } from '@proton/atoms';
import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import useNotifications from '@proton/components/hooks/useNotifications';
import useOrganizationKey from '@proton/components/hooks/useOrganizationKey';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch, useSelector } from '@proton/redux-shared-store';
import type { Member } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

const Wrap = ({ children }: { children: ReactNode }) => {
    return (
        <Card rounded className="mb-4 p-2" padded={false}>
            {children}
        </Card>
    );
};

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    members: Member[];
    onConfirm: () => void;
}

const ConfirmDeleteMembers = ({ members, onConfirm, ...rest }: Props) => {
    const n = members.length;
    return (
        <Prompt
            title={c('sso').ngettext(msgid`Delete ${n} inactive user?`, `Delete ${n} inactive users?`, n)}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        rest.onClose?.();
                    }}
                >{c('Action').t`Delete`}</Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {n === 1
                ? c('Info').t`This will permanently delete the data and all email addresses associated with this user.`
                : c('Info')
                      .t`This will permanently delete the data and all email addresses associated with these users.`}
        </Prompt>
    );
};

const AccordionButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => {
    return (
        <InlineLinkButton type="button" className="mt-2 color-weak hover:color-weak" onClick={onClick}>
            {children}
        </InlineLinkButton>
    );
};

const MembersListItem = ({ member }: { member: Member }) => {
    const name = member.Name;
    const email = getMemberEmailOrName(member);
    return (
        <div className="text-ellipsis w-full">
            <span className="text-bold" title={name}>
                {name}
            </span>{' '}
            {email !== name && <span title={email}>({email})</span>}
        </div>
    );
};

const MembersList = ({ members }: { members: Member[] }) => {
    const [toggled, setToggled] = useState(false);

    const max = 10;
    const total = members.length;
    const canHide = total > max;

    const firstMembers = toggled ? members : members.slice(0, max);
    const lastMembers = toggled ? [] : members.slice(max);

    return (
        <div>
            <ul className="m-0 flex flex-column gap-1 pt-2 unstyled">
                {firstMembers.map((member) => {
                    return (
                        <li key={member.ID} className="block w-full">
                            <MembersListItem member={member} />
                        </li>
                    );
                })}
            </ul>
            {lastMembers.length > 0 && (
                <AccordionButton onClick={() => setToggled(true)}>{c('Action').t`Show all`}</AccordionButton>
            )}
            {toggled && canHide && (
                <AccordionButton onClick={() => setToggled(false)}>{c('Action').t`Hide`}</AccordionButton>
            )}
        </div>
    );
};

const MemberListBanner = ({ icon, members, action }: { icon: IconName; members: ReactNode; action: ReactNode }) => {
    return (
        <Wrap>
            <div className="flex flex-column md:flex-row flex-nowrap gap-2">
                <div className="md:flex-1 gap-2 flex flex-nowrap">
                    <span className="shrink-0">
                        <Icon name={icon} className="align-text-top" />
                    </span>
                    <div>{members}</div>
                </div>
                <div className="md:shrink-0">{action}</div>
            </div>
        </Wrap>
    );
};

const useOrganizationUnprivatizationModals = () => {
    const [organizationKey] = useOrganizationKey();

    const joinedUnprivatizationState = useSelector(selectJoinedUnprivatizationState);
    const disabledMembers = useSelector(selectDisabledMembers);
    const dispatch = useDispatch();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [loadingDelete, withLoadingDelete] = useLoading();
    const { createNotification } = useNotifications();

    const unprivatizationApprovalInfo = (() => {
        const membersToUnprivatize = joinedUnprivatizationState.approval.map(({ member }) => member);
        if (!organizationKey?.privateKey || !membersToUnprivatize.length) {
            return null;
        }
        const n = membersToUnprivatize.length;
        return (
            <MemberListBanner
                icon="info-circle"
                members={
                    <>
                        {c('sso').ngettext(
                            msgid`${n} user has joined your organization through your Identity Provider. Review the account now:`,
                            `${n} users have joined your organization through your Identity Provider. Review their accounts now:`,
                            n
                        )}
                        <MembersList members={membersToUnprivatize} />
                    </>
                }
                action={
                    <Button
                        size="small"
                        loading={joinedUnprivatizationState.loading.approval}
                        onClick={() => {
                            dispatch(unprivatizeApprovalMembers({ membersToUnprivatize }));
                        }}
                    >
                        {c('unprivatization').t`Approve all`}
                    </Button>
                }
            />
        );
    })();

    const unprivatizationFailureInfo = (() => {
        const membersToUnprivatize = joinedUnprivatizationState.failures.map(({ member }) => member);
        if (!organizationKey?.privateKey || !membersToUnprivatize.length) {
            return null;
        }
        const n = membersToUnprivatize.length;
        return (
            <MemberListBanner
                icon="exclamation-triangle-filled"
                members={
                    <>
                        {c('unprivatization').ngettext(
                            msgid`Could not automatically enable administrator access for ${n} user, because their encryption keys have been updated in the meanwhile:`,
                            `Could not automatically enable administrator access for ${n} users, because their encryption keys have been updated in the meanwhile:`,
                            n
                        )}
                        <MembersList members={membersToUnprivatize} />
                    </>
                }
                action={
                    <Button
                        size="small"
                        loading={joinedUnprivatizationState.loading.automatic}
                        onClick={() => {
                            dispatch(
                                unprivatizeMembersBackground({
                                    verifyOutboundPublicKeys,
                                    target: {
                                        type: 'action',
                                        members: membersToUnprivatize,
                                    },
                                    options: {
                                        ignoreRevisionCheck: true,
                                    },
                                })
                            );
                        }}
                    >
                        {c('unprivatization').t`Enable manually`}
                    </Button>
                }
            />
        );
    })();

    const [confirmDeleteProps, setConfirmDelete, renderConfirmDelete] = useModalState();

    const disabledInfo = (() => {
        if (!disabledMembers.length) {
            return null;
        }
        const n = disabledMembers.length;
        return (
            <MemberListBanner
                icon="info-circle"
                members={
                    <>
                        {c('sso').ngettext(
                            msgid`${n} user is inactive. You can safely remove this user from your organization.`,
                            `${n} users are inactive. You can safely remove them from your organization.`,
                            n
                        )}
                        <MembersList members={disabledMembers} />
                    </>
                }
                action={
                    <Button
                        size="small"
                        loading={loadingDelete}
                        onClick={() => {
                            setConfirmDelete(true);
                        }}
                    >
                        {c('sso').ngettext(msgid`Delete ${n} user`, `Delete ${n} users`, n)}
                    </Button>
                }
            />
        );
    })();

    const memberInfo = (
        <>
            {unprivatizationApprovalInfo}
            {unprivatizationFailureInfo}
            {disabledInfo}

            {renderConfirmDelete && (
                <ConfirmDeleteMembers
                    members={disabledMembers}
                    onConfirm={() => {
                        withLoadingDelete(
                            dispatch(deleteMembers({ members: disabledMembers })).then((result) => {
                                if (result.success.length && !result.failure.length) {
                                    confirmDeleteProps.onClose();
                                    createNotification({
                                        text: c('Info').t`All inactive members deleted`,
                                    });
                                }
                            })
                        );
                    }}
                    {...confirmDeleteProps}
                />
            )}
        </>
    );

    return {
        memberInfo,
    };
};

export default useOrganizationUnprivatizationModals;
