import { useEffect, useRef } from 'react';

import { useCustomDomains } from '@proton/account/domains/hooks';
import {
    convertExternalAddresses,
    convertMemberExternalAddresses,
} from '@proton/account/organizationKey/convertAddresses';
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
    const runningRef = useRef(false);

    useEffect(() => {
        if (!domains?.length || oncePerPageLoad || runningRef.current) {
            return;
        }
        runningRef.current = true;
        Promise.all([
            dispatch(
                convertExternalAddresses({
                    domains,
                    keyTransparencyVerify,
                    keyTransparencyCommit,
                })
            ),
            dispatch(
                convertMemberExternalAddresses({
                    domains,
                    keyTransparencyVerify,
                    keyTransparencyCommit,
                })
            ),
        ])
            .catch(() => {
                oncePerPageLoad = true;
            })
            .finally(() => {
                runningRef.current = false;
            });
    }, [domains]);
};

export default useConvertExternalAddresses;
