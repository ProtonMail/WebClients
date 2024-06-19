import { useEffect } from 'react';

import { unprivatizeMembers } from '@proton/account';
import { useApi, useMembers } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import noop from '@proton/utils/noop';

import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';

const useUnprivatizeMembers = () => {
    const dispatch = useDispatch();
    const api = useApi();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [members] = useMembers();

    useEffect(() => {
        dispatch(unprivatizeMembers({ api, verifyOutboundPublicKeys })).catch(noop);
    }, [members]);
};

export default useUnprivatizeMembers;
