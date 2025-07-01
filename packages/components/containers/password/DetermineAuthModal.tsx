import { useEffect, useState } from 'react';

import type { AuthModalProps } from '@proton/components/containers/password/AuthModal';
import SSOAuthModal from '@proton/components/containers/password/SSOAuthModal';
import SrpAuthModal from '@proton/components/containers/password/SrpAuthModal';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { getInfo } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { InfoAuthedResponse, SSOInfoResponse } from '@proton/shared/lib/authentication/interface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

type InfoResult =
    | {
          type: 'sso';
          data: SSOInfoResponse;
      }
    | {
          type: 'srp';
          data: InfoAuthedResponse;
      };

const DetermineAuthModal = (props: AuthModalProps) => {
    const normalApi = useApi();
    const handleError = useErrorHandler();
    const [info, setInfo] = useState<InfoResult | null>(null);

    useEffect(() => {
        const run = async () => {
            const api = getSilentApi(normalApi);
            let result: SSOInfoResponse | InfoAuthedResponse;
            try {
                result = await api<SSOInfoResponse | InfoAuthedResponse>(
                    getInfo({ intent: 'Auto', reauthScope: props.scope })
                );
            } catch (e: any) {
                const { code } = getApiError(e);
                if (code === API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO) {
                    result = await api<SSOInfoResponse>(getInfo({ intent: 'SSO', reauthScope: props.scope }));
                } else {
                    throw e;
                }
            }
            const value =
                'SSOChallengeToken' in result
                    ? ({ type: 'sso', data: result } as const)
                    : 'Modulus' in result
                      ? ({ type: 'srp', data: result } as const)
                      : null;
            if (value === null) {
                throw new Error('Unknown authentication session');
            }
            setInfo(value);
        };
        run().catch((error) => {
            props.onError?.(error);
            props.onCancel?.();
            props.onClose?.();
            handleError(error);
        });
    }, []);

    if (!info) {
        return null;
    }

    if (info.type === 'sso') {
        return <SSOAuthModal {...props} info={info.data} />;
    }

    return <SrpAuthModal {...props} info={info.data} />;
};

export default DetermineAuthModal;
