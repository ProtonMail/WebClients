import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    InputFieldTwo,
    type OnLoginCallback,
    type OnLoginCallbackArguments,
    PasswordInputTwo,
    SimpleDropdown,
    useErrorHandler,
    useFormErrors,
    useModalTwoPromise,
} from '@proton/components';
import type { AuthSession } from '@proton/components/containers/login/interface';
import { handleReAuthKeyPassword } from '@proton/components/containers/login/loginActions';
import SSOAuthModal from '@proton/components/containers/password/SSOAuthModal';
import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';
import { queryScopes } from '@proton/shared/lib/api/auth';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getSettings } from '@proton/shared/lib/api/settings';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { ProduceForkParameters } from '@proton/shared/lib/authentication/fork';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { UserSettings, KeySalt as tsKeySalt } from '@proton/shared/lib/interfaces';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import { getIsGlobalSSOAccount, getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import type { Paths } from '../content/helper';
import UnlockForm from '../login/UnlockForm';
import SSOBackupPasswordForm from '../login/sso/SSOBackupPasswordForm';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import PublicUserItem from './PublicUserItem';
import SupportDropdown from './SupportDropdown';

export type ReAuthState = {
    session: AuthSession;
    reAuthType: ProduceForkParameters['promptType'];
};

export const getReAuthState = (
    forkParameters: Pick<ProduceForkParameters, 'prompt' | 'promptType' | 'promptBypass'> | undefined,
    session: AuthSession
): ReAuthState => {
    let reAuthType = forkParameters?.promptType ?? 'default';

    // Normalize the reauth type to 'default' (auth with IdP - instead of auth with backup password) for SSO accounts
    // ignoring if the offline key exists or not and 'sso' bypass is requested
    if (
        forkParameters?.promptBypass === 'sso' &&
        getIsGlobalSSOAccount(session.data.User) &&
        reAuthType !== 'default'
    ) {
        reAuthType = 'default';
    }

    return {
        session,
        reAuthType,
    };
};

interface SrpFormProps {
    onSubmit: (keyPassword: string) => Promise<void>;
    below: ReactNode;
}

const SrpForm = ({ onSubmit, below }: SrpFormProps) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [submitting, withSubmitting] = useLoading();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    return (
        <form
            name="loginForm"
            onSubmit={(event) => {
                event.preventDefault();
                setErrorMsg(null);
                if (!onFormSubmit()) {
                    return;
                }
                withSubmitting(onSubmit(password)).catch(noop);
            }}
            method="post"
        >
            <InputFieldTwo
                id="password"
                bigger
                label={c('Label').t`Password`}
                error={validator([requiredValidator(password)]) || !!errorMsg}
                as={PasswordInputTwo}
                disableChange={submitting}
                autoComplete="current-password"
                autoFocus
                value={password}
                onValue={setPassword}
                rootClassName="mt-2"
                onChange={() => setErrorMsg(null)}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={submitting} className="mt-4">
                {
                    // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                    submitting ? c('Action').t`Signing in` : c('Action').t`Sign in`
                }
            </Button>
            {below}
        </form>
    );
};

const ReAuthContainer = ({
    toApp,
    paths,
    onLogin,
    onSwitch,
    state,
    onPreSubmit,
}: {
    toApp?: APP_NAMES;
    paths: Paths;
    onLogin: OnLoginCallback;
    onSwitch: () => void;
    state: ReAuthState;
    onPreSubmit: () => Promise<void>;
}) => {
    const [data, setData] = useState<{ step: 'initial' | 'unlock'; salts: tsKeySalt[] }>({
        step: 'initial',
        salts: [],
    });
    const [ssoAuthModal, showSSOAuthModal] = useModalTwoPromise();
    const errorHandler = useErrorHandler();
    const idpButtonRef = useRef<HTMLButtonElement>(null);
    const normalApi = useApi();

    const { UID, User } = state.session.data;
    const uidApi = getUIDApi(UID, normalApi);

    const nameToDisplay = User.DisplayName || User.Name || User.Email || '';
    const initials = getInitials(nameToDisplay);

    useEffect(() => {
        idpButtonRef?.current?.click();
    }, []);

    const handleFinalizeLogin = (session: OnLoginCallbackArguments) => {
        return onLogin({ ...session, prompt: null, flow: 'reauth' });
    };

    const handleSubmitKeyPassword = async (password: string, salts: tsKeySalt[], source?: SessionSource) => {
        const session = await handleReAuthKeyPassword({
            authSession: state.session,
            api: uidApi,
            User,
            clearKeyPassword: password,
            salts,
            source,
        });
        return handleFinalizeLogin(session);
    };

    const handleSubmitSrp = async (password: string) => {
        await srpAuth({
            api: uidApi,
            credentials: { password },
            config: { ...queryUnlock(), silence: true },
        });

        if (state.reAuthType === 'default' || !!state.session.data.offlineKey || !state.session.data.User.Keys.length) {
            return handleFinalizeLogin(state.session);
        }

        const [{ UserSettings }, salts] = await Promise.all([
            uidApi<{ UserSettings: UserSettings }>(getSettings()),
            uidApi<{ KeySalts: tsKeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts),
        ]);

        if (UserSettings.Password.Mode === SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE) {
            return handleSubmitKeyPassword(password, salts);
        }

        setData({ step: 'unlock', salts });
    };

    const getSSOSalts = async () => {
        if (data.salts.length > 0) {
            return data.salts;
        }
        // Ideally this would have been completed by the API modal handlers, however this container is in a public
        // context and thus isn't initialized properly. So we add this custom handling for SSO users without locked scope
        // to be able to fetch the key salts.
        const { Scopes } = await uidApi<{ Scopes: string[] }>(queryScopes());
        if (!Scopes.includes('locked')) {
            return;
        }
        const { KeySalts } = await uidApi<{
            KeySalts: tsKeySalt[];
        }>({
            ...getKeySalts(),
            ignoreHandler: [HTTP_ERROR_CODES.UNLOCK],
        });
        return KeySalts;
    };

    const handleSubmitSSO = async (keyPassword: string) => {
        let salts = await getSSOSalts();
        if (!salts) {
            await showSSOAuthModal();
            salts = await getSSOSalts();
        }
        if (!salts) {
            return;
        }
        setData({ step: 'initial', salts });
        return handleSubmitKeyPassword(keyPassword, salts, SessionSource.Saml);
    };

    const srpLoginForm = (
        <SrpForm
            onSubmit={async (password) => {
                await onPreSubmit();
                await handleSubmitSrp(password).catch(errorHandler);
            }}
            below={
                <>
                    <hr className="my-4" />

                    <div className="text-center">
                        <SupportDropdown
                            buttonClassName="mx-auto link link-focus"
                            content={c('Link').t`Trouble signing in?`}
                        >
                            <Link
                                to={paths.reset}
                                className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                            >
                                <Icon name="key" />
                                {c('Link').t`Forgot password?`}
                            </Link>
                            <Link
                                to={paths.forgotUsername}
                                className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                            >
                                <Icon name="user-circle" />
                                {c('Link').t`Forgot username?`}
                            </Link>
                        </SupportDropdown>
                    </div>
                </>
            }
        />
    );

    const unlockForm = (
        <UnlockForm
            onSubmit={async (keyPassword) => {
                await onPreSubmit();
                await wait(500);
                await handleSubmitKeyPassword(keyPassword, data.salts).catch(errorHandler);
            }}
        />
    );

    const handleSubmitSSOIdP = async () => {
        await showSSOAuthModal();
        return handleFinalizeLogin(state.session);
    };

    const ssoLoginForm =
        state.reAuthType === 'default' || getIsSSOVPNOnlyAccount(state.session.data.User) ? (
            <div className="mt-4">
                <Button
                    ref={idpButtonRef}
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    onClick={async () => {
                        await onPreSubmit();
                        await handleSubmitSSOIdP().catch(errorHandler);
                    }}
                >
                    {c('Action').t`Continue`}
                </Button>
            </div>
        ) : (
            <SSOBackupPasswordForm
                onSubmit={async (keyPassword) => {
                    await onPreSubmit();
                    await wait(500);
                    await handleSubmitSSO(keyPassword).catch(errorHandler);
                }}
            />
        );

    const user = (
        <div className="p-3 flex items-start w-full text-left rounded relative">
            <span className="flex user-initials rounded bg-primary">
                <span className="m-auto text-semibold" aria-hidden="true">
                    {initials}
                </span>
            </span>
            <div className="account-button-content mx-3 flex-1 mt-custom" style={{ '--mt-custom': `-0.25em` }}>
                <div className="text-left">
                    <div className="text-break">
                        <strong>{nameToDisplay}</strong>
                    </div>
                    {User.Email && <div className="text-break color-weak">{User.Email}</div>}
                </div>
            </div>
        </div>
    );

    const initialForm = getIsGlobalSSOAccount(User) ? ssoLoginForm : srpLoginForm;

    return (
        <>
            {ssoAuthModal((props) => {
                return (
                    <SSOAuthModal
                        {...props}
                        api={uidApi}
                        scope="locked"
                        config={queryUnlock()}
                        onSuccess={() => props.onResolve()}
                        onClose={() => props.onReject()}
                        onCancel={() => props.onReject()}
                    />
                );
            })}
            <Layout
                toApp={toApp}
                topRight={
                    <SimpleDropdown
                        as={PublicUserItem}
                        originalPlacement="bottom-end"
                        title={c('Action').t`Switch or add account`}
                        User={User}
                    >
                        <DropdownMenu>
                            <DropdownMenuButton
                                className="flex flex-nowrap items-center gap-2 text-left"
                                onClick={onSwitch}
                            >
                                <Icon name="plus" />
                                {c('Action').t`Switch or add account`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </SimpleDropdown>
                }
                hasDecoration={false}
            >
                <Main>
                    <Header title={c('Action').t`Sign in`} />
                    <Content className="text-center">
                        {user}
                        {data.step === 'initial' && initialForm}
                        {data.step === 'unlock' && unlockForm}
                    </Content>
                </Main>
            </Layout>
        </>
    );
};

export default ReAuthContainer;
