import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import { ExternalSSOError, handleExternalSSOLogin } from '@proton/components/containers/login/ssoExternalLogin';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { SCOPE_REAUTH_SSO, getInfo } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { SSOInfoResponse } from '@proton/shared/lib/authentication/interface';
import { API_CODES, APPS } from '@proton/shared/lib/constants';
import { getVpnAccountUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import type { OwnAuthModalProps, SSOAuthModalResult } from './interface';

type State =
    | {
          type: 'error';
          error: any;
          extra?: string;
      }
    | {
          type: 'loading';
      }
    | {
          type: 'init';
      };

const initialState = { type: 'init' } as const;

export interface SSOAuthModalProps
    extends Omit<OwnAuthModalProps, 'onSuccess'>,
        Omit<PromptProps, 'title' | 'buttons' | 'children' | 'onError'> {
    onSuccess?: (data: SSOAuthModalResult) => Promise<void> | void;
}

const SSOAuthModal = ({ scope, onCancel, onClose, onSuccess, onError, config, ...rest }: SSOAuthModalProps) => {
    const abortRef = useRef<AbortController | null>(null);
    const handleError = useErrorHandler();
    const [state, setState] = useState<State>(initialState);
    const ssoInfoResponsePromiseRef = useRef<Promise<SSOInfoResponse> | null>(null);
    const api = useApi();
    const { APP_NAME } = useConfig();

    const refresh = useCallback(() => {
        // The SSO info response is cached so that browsers have an easier time allowing the new tab to be opened
        ssoInfoResponsePromiseRef.current = api<SSOInfoResponse>(getInfo({ intent: 'SSO', reauthScope: scope }));
    }, []);

    const cancelClose = () => {
        onCancel?.();
        onClose?.();
    };

    useEffect(() => {
        refresh();
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleSubmit = async () => {
        if (!ssoInfoResponsePromiseRef.current) {
            return;
        }

        const abortController = new AbortController();
        const silentApi = getSilentApi(api);

        try {
            setState({ type: 'loading' });

            abortRef.current?.abort();
            abortRef.current = abortController;

            const ssoInfoResponse = await ssoInfoResponsePromiseRef.current;
            const { token } = await handleExternalSSOLogin({
                signal: abortController.signal,
                token: ssoInfoResponse.SSOChallengeToken,
                finalRedirectBaseUrl: APP_NAME === APPS.PROTONVPN_SETTINGS ? getVpnAccountUrl() : undefined,
            });

            const response: Response = await silentApi({
                ...config,
                output: 'raw',
                data: {
                    ...config.data,
                    SsoReauthToken: token,
                },
            });
            // We want to just keep the modal open until the consumer's promise is finished. Not interested in errors.
            await onSuccess?.({ type: 'sso', response, credentials: { ssoReauthToken: token } })?.catch(noop);
            onClose?.();
        } catch (error) {
            if (error instanceof ExternalSSOError) {
                // Try again
                refresh();
                setState({ type: 'error', error, extra: c('saml: Error').t`Sign in wasn't successfully completed.` });
                return;
            }

            const { code } = getApiError(error);
            // Try again
            if (code === SCOPE_REAUTH_SSO || code === API_CODES.NOT_FOUND_ERROR) {
                refresh();
                handleError(error);
                setState(initialState);
                return;
            }

            onError?.(error);
            cancelClose();
            return;
        } finally {
            abortController.abort();
        }
    };

    const loading = state.type === 'loading';

    // Don't allow to close this modal if it's loading as it could leave other consumers in an undefined state
    const handleClose = loading ? noop : cancelClose;

    return (
        <Prompt
            {...rest}
            title={c('sso').t`Sign in to your organization`}
            buttons={[
                <Button color="norm" onClick={handleSubmit} loading={loading}>
                    {c('sso').t`Sign in`}
                </Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <div>{c('sso').t`You'll be redirected to your third-party SSO provider.`}</div>
            {state.type === 'error' && state.extra && (
                <div className="mt-4">
                    <div className="color-danger">{state.extra}</div>
                </div>
            )}
        </Prompt>
    );
};

export default SSOAuthModal;
