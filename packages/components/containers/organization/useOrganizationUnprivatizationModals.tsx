import { c, msgid } from 'ttag';

import { deleteMembers } from '@proton/account/members/actions';
import { selectDisabledMembers } from '@proton/account/members/selectors';
import {
    selectJoinedUnprivatizationState,
    unprivatizeMembersAutomatic,
    unprivatizeMembersManual,
} from '@proton/account/members/unprivatizeMembers';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { Member } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import useModalState from '../../components/modalTwo/useModalState';
import Prompt, { type PromptProps } from '../../components/prompt/Prompt';
import useNotifications from '../../hooks/useNotifications';
import { MemberListBanner, MembersList } from './MemberListBanner';

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

const useOrganizationUnprivatizationModals = () => {
    const isScimGroupsEnabled = useFlag('UserGroupsScimGroups');
    const [organizationKey] = useOrganizationKey();

    const joinedUnprivatizationState = useSelector(selectJoinedUnprivatizationState);
    const disabledMembers = useSelector(selectDisabledMembers);
    const dispatch = useDispatch();
    const [loadingDelete, withLoadingDelete] = useLoading();
    const { createNotification } = useNotifications();

    const unprivatizationApprovalInfo = (() => {
        // When the SCIM groups feature is enabled, ScimSetupBannerAndModal handles this approval flow.
        if (isScimGroupsEnabled) {
            return null;
        }

        const membersToUnprivatize = joinedUnprivatizationState.approval.map(({ member }) => member);
        if (!organizationKey?.privateKey || !membersToUnprivatize.length) {
            return null;
        }
        const n = membersToUnprivatize.length;
        return (
            <MemberListBanner
                members={
                    <>
                        <p className="text-bold my-0">
                            {c('sso').ngettext(
                                msgid`${n} user has joined your organization through your identity provider`,
                                `${n} users have joined your organization through your identity provider`,
                                n
                            )}
                        </p>
                        {c('unprivatization').ngettext(
                            msgid`Review their account now.`,
                            `Review their accounts now.`,
                            n
                        )}
                        <MembersList members={membersToUnprivatize} />
                    </>
                }
                action={
                    <Button
                        shape="outline"
                        loading={joinedUnprivatizationState.loading.approval}
                        onClick={() => {
                            dispatch(unprivatizeMembersManual({ membersToUnprivatize })).catch(noop);
                        }}
                    >
                        {c('unprivatization').t`Confirm all`}
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
                variant={BannerVariants.WARNING}
                members={
                    <>
                        <p className="text-bold my-0">
                            {c('unprivatization').ngettext(
                                msgid`Could not enable admin access for ${n} user`,
                                `Could not enable admin access for ${n} users`,
                                n
                            )}
                        </p>
                        {c('unprivatization').t`Their encryption keys were updated while we were making changes.`}
                        <MembersList members={membersToUnprivatize} />
                    </>
                }
                action={
                    <Button
                        shape="outline"
                        loading={joinedUnprivatizationState.loading.automatic}
                        onClick={() => {
                            dispatch(
                                unprivatizeMembersAutomatic({
                                    target: {
                                        type: 'action',
                                        members: membersToUnprivatize,
                                    },
                                    options: {
                                        ignoreRevisionCheck: true,
                                    },
                                })
                            ).catch(noop);
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
                members={
                    <>
                        <span className="block text-bold">
                            {c('sso').ngettext(msgid`${n} user is inactive.`, `${n} users are inactive.`, n)}
                        </span>
                        {c('unprivatization').ngettext(
                            msgid`You can safely remove this user from your organization.`,
                            `You can safely remove these users from your organization.`,
                            n
                        )}

                        <MembersList members={disabledMembers} />
                    </>
                }
                action={
                    <Button
                        shape="outline"
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
                        ).catch(noop);
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
