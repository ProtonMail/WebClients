import { type ReactNode, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { useMachine } from '@xstate/react';
import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import SSOAuthModal from '@proton/components/containers/password/SSOAuthModal';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getIsGlobalSSOAccount, getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys/accountType';

import type { OnLoginCallback } from '../authSession';
import PublicUserItem from '../components/PublicUserItem';
import SSOBackupPasswordForm from '../components/password-forms/SSOBackupPasswordForm';
import UnlockForm from '../components/password-forms/UnlockForm';
import Content from '../layout/Content';
import Header from '../layout/Header';
import Layout from '../layout/Layout';
import Main from '../layout/Main';
import SupportDropdown from '../layout/SupportDropdown';
import { usePublicAppAuth } from '../publicAppAuth';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { selectPaths, selectPreAppIntent } from '../state-machine/publicAppStateMachine';
import { runLogin } from '../state-machine/runLogin';
import { createReAuthActors } from './reAuthActors';
import { reAuthStateMachine, selectAwaitingProvider, selectSubmitting } from './reAuthStateMachine';
import type { ReAuthState } from './reauthContainerState';

interface SrpFormProps {
    onSubmit: (password: string) => void;
    submitting: boolean;
    below: ReactNode;
}

const SrpForm = ({ onSubmit, submitting, below }: SrpFormProps) => {
    const { validator, onFormSubmit } = useFormErrors();
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
                onSubmit(password);
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

const ReAuthContainer = ({ state }: { state: ReAuthState }) => {
    const { onPreSubmit } = usePublicAppAuth();
    const history = useHistory();
    const publicApp = PublicAppContext.useActorRef();
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const paths = PublicAppContext.useSelector(selectPaths, isDeepEqual);
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);
    const onSwitch = () => history.push(SSO_PATHS.SWITCH);
    const errorHandler = useErrorHandler();
    const normalApi = useApi();

    const { UID, User } = state.session.data;
    const uidApi = getUIDApi(UID, normalApi);

    const [snapshot, send, actorRef] = useMachine(
        reAuthStateMachine.provide({
            actors: createReAuthActors({ api: uidApi, preSubmit: onPreSubmit, login: onLogin }),
        }),
        { input: state }
    );
    const submitting = selectSubmitting(snapshot);
    const awaitingProvider = selectAwaitingProvider(snapshot);
    const [ssoModalProps, setSSOModalOpen, renderSSOModal] = useModalState();

    useEffect(() => {
        setSSOModalOpen(awaitingProvider);
    }, [awaitingProvider]);

    useEffect(() => {
        const subscription = actorRef.on('error', ({ error }) => errorHandler(error));
        return () => subscription.unsubscribe();
    }, [actorRef, errorHandler]);

    const nameToDisplay = User.DisplayName || User.Name || User.Email || '';
    const initials = getInitials(nameToDisplay);

    const srpLoginForm = (
        <SrpForm
            onSubmit={(password) => send({ type: 'password.submitted', password })}
            submitting={submitting}
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
                                <IcKey />
                                {c('Link').t`Forgot password?`}
                            </Link>
                            <Link
                                to={paths.forgotUsername}
                                className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                            >
                                <IcUserCircle />
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
            submitting={submitting}
            onSubmit={(keyPassword) => send({ type: 'unlockPassword.submitted', keyPassword })}
        />
    );

    const ssoLoginForm =
        state.reAuthType === 'default' || getIsSSOVPNOnlyAccount(state.session.data.User) ? (
            <div className="mt-4">
                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    loading={submitting}
                    onClick={() => send({ type: 'idp.started' })}
                >
                    {c('Action').t`Continue`}
                </Button>
            </div>
        ) : (
            <SSOBackupPasswordForm
                submitting={submitting}
                onSubmit={(keyPassword) => send({ type: 'backupPassword.submitted', keyPassword })}
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
            {renderSSOModal && (
                <SSOAuthModal
                    open={ssoModalProps.open}
                    onExit={ssoModalProps.onExit}
                    api={uidApi}
                    scope="locked"
                    config={queryUnlock()}
                    onSuccess={() => send({ type: 'idp.authenticated' })}
                    onClose={() => send({ type: 'idp.cancelled' })}
                    onCancel={() => send({ type: 'idp.cancelled' })}
                />
            )}
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
                                <IcPlus />
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
                        {snapshot.matches('awaitingUnlockPassword') || snapshot.matches('unlocking')
                            ? unlockForm
                            : initialForm}
                    </Content>
                </Main>
            </Layout>
        </>
    );
};

export default ReAuthContainer;
