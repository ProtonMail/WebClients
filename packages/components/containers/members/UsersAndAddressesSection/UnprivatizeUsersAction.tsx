import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { selectMembers } from '@proton/account/members';
import { Button } from '@proton/atoms';
import { useSelector } from '@proton/redux-shared-store';
import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getIsMemberSetup } from '@proton/shared/lib/keys/memberHelper';
import useFlag from '@proton/unleash/useFlag';

import useModalState from '../../../components/modalTwo/useModalState';
import { ConfirmUnprivatizeMembersModal } from '../../organization/ConfirmUnprivatizeModal';

export const selectMembersToUnprivatize = createSelector(selectMembers, ({ value: members }) => {
    return (
        members?.filter(
            (member) =>
                member.Private === MEMBER_PRIVATE.UNREADABLE &&
                !member.Self &&
                !member.Unprivatization &&
                getIsMemberSetup(member)
        ) ?? []
    );
});

const Inner = () => {
    const [confirmUnprivatizeProps, setConfirmUnprivatize, renderConfirmUnprivatize] = useModalState();
    const membersToUnprivatize = useSelector(selectMembersToUnprivatize);
    return (
        <>
            {membersToUnprivatize.length > 0 && (
                <Button
                    shape="outline"
                    color="norm"
                    onClick={() => {
                        setConfirmUnprivatize(true);
                    }}
                >{c('Action').t`Enable administrator access (${membersToUnprivatize.length})`}</Button>
            )}
            {renderConfirmUnprivatize && (
                <ConfirmUnprivatizeMembersModal members={membersToUnprivatize} {...confirmUnprivatizeProps} />
            )}
        </>
    );
};

export const UnprivatizeUsersAction = () => {
    const isEnabled = useFlag('BulkUnprivatize');
    if (!isEnabled) {
        return null;
    }
    return <Inner />;
};
