import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

import { useOrganizationKey } from './hooks';
import { OrganizationSignatureState, validateOrganizationIdentity } from './organizationIdentityActions';

export type OrganizationIdentityState =
    | {
          state: 'loading';
          result: null;
      }
    | {
          state: 'valid' | 'invalid';
          result: {
              label: string;
              Icon: IconComponent;
              className: string;
          };
      };

const defaultState: OrganizationIdentityState = {
    state: 'loading',
    result: null,
};

const getOrganizationIdentityState = (state: OrganizationSignatureState | null): OrganizationIdentityState => {
    if (state === OrganizationSignatureState.valid) {
        return {
            state: 'valid',
            result: {
                label: c('passwordless').t`We have verified the authenticity of this identity.`,
                Icon: IcCheckmarkCircleFilled,
                className: 'color-success',
            },
        };
    }
    return {
        state: 'invalid',
        result: {
            label: c('passwordless').t`We couldn't verify the authenticity of this identity.`,
            Icon: IcInfoCircleFilled,
            className: 'color-danger',
        },
    };
};

const useOrganizationIdentity = (): { state: OrganizationIdentityState; signatureAddress: string } => {
    const [organizationKey] = useOrganizationKey();
    const [state, setState] = useState<OrganizationSignatureState | null>(null);
    const signature = organizationKey?.Key.FingerprintSignature || '';
    const signatureAddress = organizationKey?.Key.FingerprintSignatureAddress || '';
    const dispatch = useDispatch();

    useEffect(() => {
        let ignore = false;

        setState(null);

        const run = async () => {
            try {
                const result = await dispatch(validateOrganizationIdentity());
                if (ignore) {
                    return;
                }
                // The thunk resolves to undefined when there is no identity to verify, which is
                // not a failed verification and so reports nothing.
                setState(result === undefined ? null : result);
            } catch {
                if (ignore) {
                    return;
                }
                // Failing to fetch the keys is still a failed verification, unlike having none.
                setState(OrganizationSignatureState.error);
            }
        };

        void run();

        return () => {
            ignore = true;
        };
    }, [organizationKey?.privateKey, signature, signatureAddress]);

    return {
        state: state === null ? defaultState : getOrganizationIdentityState(state),
        signatureAddress,
    };
};

export default useOrganizationIdentity;
