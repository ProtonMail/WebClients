import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components/components/icon/Icon';
import type { Unwrap } from '@proton/shared/lib/interfaces';
import { OrganizationSignatureState, validateOrganizationSignatureHelper } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { useApi, useOrganizationKey } from '../../hooks';
import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';

export interface OrganizationIdentityState {
    state: 'loading' | 'complete';
    result: {
        label: string;
        state: 'valid' | 'invalid';
        icon: IconName;
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
            icon: 'checkmark-circle-filled',
            className: 'color-success',
        } as const;
    }
    return {
        label: c('passwordless').t`We couldn't verify authenticity of this identity.`,
        state: 'invalid',
        icon: 'info-circle-filled',
        className: 'color-danger',
    } as const;
};

const useOrganizationIdentity = () => {
    const [organizationKey] = useOrganizationKey();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [state, setState] = useState(defaultState);
    const signature = organizationKey?.Key.FingerprintSignature || '';
    const signatureAddress = organizationKey?.Key.FingerprintSignatureAddress || '';
    const api = useApi();

    useEffect(() => {
        if (!organizationKey?.privateKey || !signature || !signatureAddress) {
            setState(defaultState);
            return;
        }
        const run = async () => {
            const result = await validateOrganizationSignatureHelper({
                email: signatureAddress,
                armoredSignature: signature,
                verifyOutboundPublicKeys,
                privateKey: organizationKey.privateKey,
                api,
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
