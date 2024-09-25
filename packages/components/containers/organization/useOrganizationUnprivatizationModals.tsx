import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import {
    selectJoinedUnprivatizationState,
    unprivatizeApprovalMembers,
    unprivatizeMembersBackground,
} from '@proton/account/members/unprivatizeMembers';
import { Button, Card } from '@proton/atoms';
import { Icon, useOrganizationKey } from '@proton/components';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { useDispatch, useSelector } from '@proton/redux-shared-store';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

const Wrap = ({ children }: { children: ReactNode }) => {
    return (
        <Card rounded className="mb-4">
            {children}
        </Card>
    );
};

const useOrganizationUnprivatizationModals = () => {
    const [organizationKey] = useOrganizationKey();

    const joinedUnprivatizationState = useSelector(selectJoinedUnprivatizationState);
    const dispatch = useDispatch();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();

    const unprivatizationApprovalInfo = (() => {
        const membersToUnprivatize = joinedUnprivatizationState.approval.map(({ member }) => member);
        if (!organizationKey?.privateKey || !membersToUnprivatize.length) {
            return null;
        }
        const n = membersToUnprivatize.length;
        return (
            <Wrap>
                <div className="flex flex-column md:flex-row flex-nowrap gap-2">
                    <div className="md:flex-1">
                        <Icon name="info-circle" className="align-text-top" />{' '}
                        {c('unprivatization').ngettext(
                            msgid`${n} user have joined your organization through your Identity Provider. Approve or reject their accounts now:`,
                            `${n} users have joined your organization through your Identity Provider. Approve or reject their accounts now:`,
                            n
                        )}
                    </div>
                    <div className="md:shrink-0">
                        <Button
                            size="small"
                            loading={joinedUnprivatizationState.loading.approval}
                            onClick={() => {
                                dispatch(unprivatizeApprovalMembers({ membersToUnprivatize }));
                            }}
                        >
                            {c('unprivatization').t`Approve all`}
                        </Button>
                    </div>
                </div>
                <ul className="m-0">
                    {membersToUnprivatize.map((member) => {
                        const name = member.Name;
                        const email = getMemberEmailOrName(member);
                        return (
                            <li key={member.ID} className="mt-2">
                                <span className="text-ellipsis text-bold" title={name}>
                                    {name}
                                </span>{' '}
                                <span>({email})</span>
                            </li>
                        );
                    })}
                </ul>
            </Wrap>
        );
    })();

    const unprivatizationFailureInfo = (() => {
        const membersToUnprivatize = joinedUnprivatizationState.failures.map(({ member }) => member);
        if (!organizationKey?.privateKey || !membersToUnprivatize.length) {
            return null;
        }
        const n = membersToUnprivatize.length;
        return (
            <Wrap>
                <div className="flex flex-column md:flex-row flex-nowrap gap-2">
                    <div className="md:flex-1">
                        <Icon name="exclamation-triangle-filled" className="align-text-top" />{' '}
                        {c('unprivatization').ngettext(
                            msgid`Could not automatically enable administrator access for ${n} user, because their encryption keys have been updated in the meanwhile:`,
                            `Could not automatically enable administrator access for ${n} users, because their encryption keys have been updated in the meanwhile:`,
                            n
                        )}
                    </div>
                    <div className="md:shrink-0">
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
                    </div>
                </div>
                <ul className="m-0">
                    {membersToUnprivatize.map((member) => {
                        const name = member.Name;
                        const email = getMemberEmailOrName(member);
                        return (
                            <li key={member.ID} className="mt-2">
                                <span className="text-ellipsis text-bold" title={name}>
                                    {name}
                                </span>{' '}
                                <span>({email})</span>
                            </li>
                        );
                    })}
                </ul>
            </Wrap>
        );
    })();

    const memberInfo = (
        <>
            {unprivatizationApprovalInfo}
            {unprivatizationFailureInfo}
        </>
    );

    return {
        memberInfo,
    };
};

export default useOrganizationUnprivatizationModals;
