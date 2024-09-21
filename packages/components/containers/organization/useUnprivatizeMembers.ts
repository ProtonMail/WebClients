import { useEffect } from 'react';

import { unprivatizeMembers } from '@proton/account/members/unprivatizeMembers';
import { useApi, useMembers } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import noop from '@proton/utils/noop';

import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';

// TODO: This hook should be migrated fully to redux once all the KT hooks have been migrated.
const useUnprivatizeMembers = () => {
    const dispatch = useDispatch();
    const api = useApi();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [members] = useMembers();

    useEffect(() => {
        if (!members?.length) {
            return;
        }
        dispatch(
            unprivatizeMembers({
                api,
                verifyOutboundPublicKeys,
            })
        ).catch(noop);
    }, [members]);
};

export default useUnprivatizeMembers;
