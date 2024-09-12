import { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { OnLoginCallback, OnLoginCallbackArguments } from '@proton/components';
import { DropdownMenu, Icon, InputFieldTwo, PasswordInputTwo, SimpleDropdown, useFormErrors } from '@proton/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { handleReAuthKeyPassword } from '@proton/components/containers/login/loginActions';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getSettings } from '@proton/shared/lib/api/settings';
import { queryUnlock } from '@proton/shared/lib/api/user';
import type { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { User, UserSettings, KeySalt as tsKeySalt } from '@proton/shared/lib/interfaces';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import { srpAuth } from '@proton/shared/lib/srp';

import type { Paths } from '../content/helper';
import UnlockForm from '../login/UnlockForm';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import PublicUserItem from './PublicUserItem';
import SupportDropdown from './SupportDropdown';

export type ReAuthState = {
    session: {
        User: User;
        LocalID: number;
        UID: string;
        keyPassword?: string;
        clientKey: string;
        offlineKey: OfflineKey | undefined;
        persistent: boolean;
        trusted: boolean;
    };
    reAuthType: 'offline' | 'offline-bypass' | 'default';
};

const ReAuthContainer = ({
    toApp,
    paths,
    onLogin,
    onSwitch,
    state,
}: {
    toApp?: APP_NAMES;
    paths: Paths;
    onLogin: OnLoginCallback;
    onSwitch: () => void;
    state: ReAuthState;
}) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [submitting, withSubmitting] = useLoading();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [data, setData] = useState<{ step: 'login' | 'unlock'; salts: tsKeySalt[] }>({ step: 'login', salts: [] });
    const errorHandler = useErrorHandler();
    const normalApi = useApi();

    const { UID, User } = state.session;
    const uidApi = getUIDApi(UID, normalApi);

    const nameToDisplay = User.DisplayName || User.Name || User.Email || '';
    const initials = getInitials(nameToDisplay);

    const handleFinalizeLogin = (session: OnLoginCallbackArguments) => {
        return onLogin({ ...session, prompt: null, flow: 'reauth' });
    };

    const handleSubmitKeyPassword = async (password: string, salts: tsKeySalt[]) => {
        const session = await handleReAuthKeyPassword({
            authSession: state.session,
            api: uidApi,
            User,
            clearKeyPassword: password,
            salts,
        });
        return handleFinalizeLogin(session);
    };

    const handleSubmitSRP = async () => {
        await srpAuth({
            api: uidApi,
            credentials: { password },
            config: { ...queryUnlock(), silence: true },
        });

        if (state.reAuthType === 'default' || !!state.session.offlineKey || !state.session.User.Keys.length) {
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

    const loginForm = (
        <form
            name="loginForm"
            onSubmit={(event) => {
                event.preventDefault();
                setErrorMsg(null);
                if (!onFormSubmit()) {
                    return;
                }
                withSubmitting(handleSubmitSRP()).catch(errorHandler);
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

            <hr className="my-4" />

            <div className="text-center">
                <SupportDropdown buttonClassName="mx-auto link link-focus" content={c('Link').t`Trouble signing in?`}>
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
        </form>
    );

    const unlockForm = (
        <UnlockForm
            onSubmit={async (keyPassword) => {
                await handleSubmitKeyPassword(keyPassword, data.salts).catch(errorHandler);
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

    return (
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
                    {data.step === 'login' && loginForm}
                    {data.step === 'unlock' && unlockForm}
                </Content>
            </Main>
        </Layout>
    );
};

export default ReAuthContainer;
