import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { getKTUserContext } from '@proton/account/kt/actions';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { useApi } from '@proton/app-context/useApi';
import type { IconComponent } from '@proton/icons/component';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Unwrap } from '@proton/shared/lib/interfaces';
import { OrganizationSignatureState, validateOrganizationSignatureHelper } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

export interface OrganizationIdentityState {
    state: 'loading' | 'complete';
    result: {
        label: string;
        state: 'valid' | 'invalid';
        Icon: IconComponent;
        className: string;
    } | null;
}

const defaultState: OrganizationIdentityState = {
    state: 'loading',
    result: null,
};

const getResult = (result: Unwrap<ReturnType<typeof validateOrganizationSignatureHelper>> | undefined) => {
    if (result?.state === OrganizationSignatureState.valid) {
        return {
            label: c('passwordless').t`We have verified the authenticity of this identity.`,
            state: 'valid',
            Icon: IcCheckmarkCircleFilled,
            className: 'color-success',
        } as const;
    }
    return {
        label: c('passwordless').t`We couldn't verify the authenticity of this identity.`,
        state: 'invalid',
        Icon: IcInfoCircleFilled,
        className: 'color-danger',
    } as const;
};

const useOrganizationIdentity = () => {
    const [organizationKey] = useOrganizationKey();
    const [state, setState] = useState(defaultState);
    const signature = organizationKey?.Key.FingerprintSignature || '';
    const signatureAddress = organizationKey?.Key.FingerprintSignatureAddress || '';
    const api = useApi();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!organizationKey?.privateKey || !signature || !signatureAddress) {
            setState(defaultState);
            return;
        }
        const run = async () => {
            const result = await validateOrganizationSignatureHelper({
                email: signatureAddress,
                armoredSignature: signature,
                privateKey: organizationKey.privateKey,
                api,
                ktUserContext: await dispatch(getKTUserContext()),
            }).catch(noop);
            setState({
                state: 'complete',
                result: getResult(result),
            });
        };
        run();
    }, [organizationKey?.privateKey, signature, signatureAddress]);

    return {
        state,
        signatureAddress,
    };
};

export default useOrganizationIdentity;
