import { useEffect } from 'react';

import { unprivatizeMembersBackground } from '@proton/account/members/unprivatizeMembers';
import { useMembers, useOrganizationKey } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import noop from '@proton/utils/noop';

import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';

// TODO: This hook should be migrated fully to redux once all the KT hooks have been migrated.
const useUnprivatizeMembers = () => {
    const dispatch = useDispatch();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [members] = useMembers();
    const [organizationKey] = useOrganizationKey();

    useEffect(() => {
        if (!members?.length || !organizationKey?.privateKey) {
            return;
        }
        dispatch(
            unprivatizeMembersBackground({
                verifyOutboundPublicKeys,
                target: {
                    type: 'background',
                    members,
                },
            })
        ).catch(noop);
    }, [members, organizationKey?.privateKey]);
};

export default useUnprivatizeMembers;
