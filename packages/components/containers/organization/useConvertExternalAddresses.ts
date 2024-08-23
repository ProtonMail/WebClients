import { useEffect } from 'react';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { convertExternalAddresses } from '@proton/account/organizationKey/convertAddresses';
import { useGetUser } from '@proton/account/user/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store';

let oncePerPageLoad = false;

// TODO: This hook should be migrated fully to redux once all the KT hooks have been migrated.
const useConvertExternalAddresses = () => {
    const dispatch = useDispatch();
    const api = useApi();
    const [domains] = useCustomDomains();
    const getUser = useGetUser();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, getUser);

    useEffect(() => {
        if (!domains?.length || oncePerPageLoad) {
            return;
        }
        dispatch(
            convertExternalAddresses({
                domains,
                keyTransparencyVerify,
                keyTransparencyCommit,
            })
        ).catch(() => {
            oncePerPageLoad = true;
        });
    }, [domains]);
};

export default useConvertExternalAddresses;
