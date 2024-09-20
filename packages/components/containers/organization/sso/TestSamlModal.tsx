import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { InputFieldTwo } from '@proton/components/components/v2';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { ExternalSSOError, handleExternalSSOLogin } from '@proton/components/containers/login/loginActions';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { auth, createSession, getInfo, revoke } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type {
    AuthResponse,
    RefreshSessionResponse,
    SSOInfoResponse,
} from '@proton/shared/lib/authentication/interface';
import { APPS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getVpnAccountUrl } from '@proton/shared/lib/helpers/url';
import type { Api, Domain } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import successSvg from './cloud-lock-check.svg';
import errorSvg from './cloud-lock-cross.svg';

type State =
    | {
          type: 'success';
      }
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

interface Props extends ModalProps {
    domain: Domain;
}

const handleTestSaml = async ({
    email,
    api,
    abortController,
    finalRedirectBaseUrl,
}: {
    email: string;
    api: Api;
    abortController: AbortController;
    finalRedirectBaseUrl?: string;
}): Promise<State> => {
    const { UID, AccessToken } = await api<RefreshSessionResponse>(createSession());

    const authApi = getAuthAPI(UID, AccessToken, api);

    const handleCleanup = () => {
        authApi(revoke()).catch(noop);
    };

    try {
        abortController.signal.addEventListener('abort', handleCleanup);
        const ssoInfoResponse = await authApi<SSOInfoResponse>(getInfo(email, 'SSO', true));
        const { token } = await handleExternalSSOLogin({
            signal: abortController.signal,
            token: ssoInfoResponse.SSOChallengeToken,
            finalRedirectBaseUrl,
        });
        await authApi<AuthResponse>(auth({ SSOResponseToken: token }, false));
        return { type: 'success' };
    } catch (error) {
        if (error instanceof ExternalSSOError) {
            return { type: 'error', error, extra: c('saml: Error').t`Sign-in wasn't successfully completed.` };
        }
        const apiError = getApiError(error);
        if (apiError.message) {
            return { type: 'error', error, extra: apiError.message };
        }
        throw error;
    } finally {
        abortController.signal.removeEventListener('abort', handleCleanup);
        handleCleanup();
    }
};

const initialState = { type: 'init' } as const;

const TestSamlModal = ({ domain, onClose, ...rest }: Props) => {
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const [username, setUsername] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const abortRef = useRef<AbortController | null>(null);
    const handleError = useErrorHandler();
    const [state, setState] = useState<State>(initialState);
    const { APP_NAME } = useConfig();

    const formId = 'auth-form-test';
    const domainName = domain.DomainName;
    const email = `${username}@${domainName}`;

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    return (
        <ModalTwo onClose={onClose} size="small" {...rest}>
            <ModalTwoHeader
                title={(() => {
                    if (state.type === 'success') {
                        return c('saml: Title').t`It works!`;
                    }
                    if (state.type === 'error') {
                        return c('saml: Error').t`Something went wrong`;
                    }
                    if (state.type === 'loading') {
                        return c('saml: Title').t`Testing SAML configuration`;
                    }
                    return c('saml: Title').t`Test SAML configuration`;
                })()}
            />
            <ModalTwoContent>
                {(() => {
                    if (state.type === 'success') {
                        return (
                            <div className="flex flex-column gap-4">
                                <div className="text-center">
                                    <img src={successSvg} alt="" />
                                </div>
                                <div>
                                    {c('saml: Info')
                                        .t`We received a valid SAML response from your identity provider. SSO is enabled for your organization.`}
                                </div>
                            </div>
                        );
                    }

                    if (state.type === 'error') {
                        return (
                            <div className="flex flex-column gap-4">
                                <div className="text-center">
                                    <img src={errorSvg} alt="" />
                                </div>
                                <div>{c('saml: Info').t`An error occurred while testing your SSO configuration.`}</div>
                                {state.extra && (
                                    <div>
                                        <div className="text-semibold">{c('saml: Info').t`Details`}</div>
                                        <div className="rounded border bg-weak p-4 text-break-all">{state.extra}</div>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    if (state.type === 'loading') {
                        return (
                            <>
                                <div className="mb-4 flex gap-2 flex-nowrap items-center">
                                    <CircleLoader />
                                    {c('saml: Info').t`Test in progress...`}
                                </div>
                                <div>{c('saml: Info')
                                    .t`We’re testing your configuration to ensure SSO is working.`}</div>
                            </>
                        );
                    }

                    return (
                        <form
                            id={formId}
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!onFormSubmit(event.currentTarget)) {
                                    return;
                                }

                                const run = async () => {
                                    const abortController = new AbortController();

                                    try {
                                        setState({ type: 'loading' });

                                        abortRef.current?.abort();
                                        abortRef.current = abortController;

                                        const result = await handleTestSaml({
                                            email,
                                            api: silentApi,
                                            abortController,
                                            finalRedirectBaseUrl:
                                                APP_NAME === APPS.PROTONVPN_SETTINGS ? getVpnAccountUrl() : undefined,
                                        });
                                        setState(result);
                                    } catch (error) {
                                        handleError(error);
                                        setState(initialState);
                                    } finally {
                                        abortController.abort();
                                    }
                                };

                                run();
                            }}
                        >
                            <div className="color-weak mb-4">
                                {getBoldFormattedText(
                                    c('saml: Info')
                                        .t`To test this SAML configuration, please enter the login credentials for a user associated with **${domainName}**`
                                )}
                            </div>
                            <InputFieldTwo
                                autoFocus
                                id="username"
                                label={c('saml: Label').t`Email`}
                                error={validator([requiredValidator(username)])}
                                autoComplete="username"
                                value={username}
                                onValue={setUsername}
                                suffix={`@${domainName}`}
                            />
                        </form>
                    );
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                {(() => {
                    if (state.type === 'error') {
                        return (
                            <>
                                <div></div>
                                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                            </>
                        );
                    }
                    if (state.type === 'success') {
                        return (
                            <>
                                <div></div>
                                <Button color="norm" onClick={onClose}>
                                    {c('Action').t`Done`}
                                </Button>
                            </>
                        );
                    }
                    if (state.type === 'init') {
                        return (
                            <>
                                <Button onClick={onClose}>{c('saml: Action').t`Cancel`}</Button>
                                <Button color="norm" type="submit" form={formId}>
                                    {c('Action').t`Test`}
                                </Button>
                            </>
                        );
                    }
                })()}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default TestSamlModal;
