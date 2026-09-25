import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import ElectronBlockedContainer from '@proton/components/containers/app/ElectronBlockedContainer';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getIsLumoApp, getIsPassApp, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { endOfTrialIPCCall } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { isElectronApp, isElectronPass } from '@proton/shared/lib/helpers/desktop';

import { ExternalSSOFlow } from '../content/ExternalSSOConsumer';
import type { OnLoginCallback } from '../content/authSession';
import type { Paths } from '../content/helper';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import { SignInWizard } from './SignInWizard';
import { AuthType, type AuthTypeData } from './auth/interface';
import AbuseModal from './components/AbuseModal';
import type { SignInLayout } from './components/SignInLayout';
import { SignInPageLayout } from './components/SignInPageLayout';
import { SignInPassDesktopLayout } from './components/SignInPassDesktopLayout';
import { RememberMode, getRememberModeSearchParameter } from './rememberMode';
import { useRememberPreference } from './steps/credentials/useRememberPreference';
import { useSignInMachine } from './useSignInMachine';
import { SignInContext } from './wizard/SignInContext';
import { SignInProvider } from './wizard/SignInProvider';

/** Router state other pages hand to the sign-in page. */
export interface SignInLocationState {
    username?: string;
    authTypeData?: AuthTypeData;
    externalSSO?: {
        token?: string;
        flow?: ExternalSSOFlow;
    };
}

interface Props {
    defaultUsername?: string;
    initialSearchParams?: URLSearchParams;
    onLogin: OnLoginCallback;
    toAppName?: string;
    toApp?: APP_NAMES;
    showContinueTo?: boolean;
    onBack?: () => void;
    remember?: RememberMode;
    setupVPN: boolean;
    paths: Paths;
    productParam: ProductParam;
    /** Frames each step; defaults to the sign-in page (or the Pass desktop app's compact page). */
    layout?: SignInLayout;
    /** The compact credentials form, without the sign-up and support links; the default in the Pass desktop app. */
    compactForm?: boolean;
    metaTags: MetaTags | null;
    testflight?: 'vpn';
    externalRedirect?: string;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    /**
     * Send SSO users to account's SSO page instead of signing them in here. For apps other than account
     * (vpn-settings), which can't open the identity provider window themselves.
     */
    redirectsSSOToAccount?: boolean;
}

const getDefaultUsername = (searchParams?: URLSearchParams) => {
    if (!searchParams) {
        return;
    }
    return searchParams.get('username') || searchParams.get('email');
};

const getInitialAuthTypeData = (state: SignInLocationState | undefined, toApp: APP_NAMES | undefined): AuthTypeData => {
    if (state?.authTypeData) {
        return state.authTypeData;
    }
    if (getIsVPNApp(toApp) || getIsPassApp(toApp) || getIsLumoApp(toApp)) {
        return { type: AuthType.Auto };
    }
    return { type: AuthType.Srp };
};

const SignInFlow = ({
    initialSearchParams,
    metaTags,
    defaultUsername,
    onLogin,
    onBack,
    toAppName,
    toApp,
    showContinueTo,
    productParam,
    setupVPN,
    remember = RememberMode.Visible,
    forcedRemember,
    paths,
    layout,
    compactForm,
    testflight,
    externalRedirect,
    onPreSubmit,
    onStartAuth,
    redirectsSSOToAccount = false,
}: Omit<Props, 'layout' | 'compactForm'> & {
    layout: SignInLayout;
    compactForm: boolean;
    /** Set by the desktop apps; wins over the remember search parameter and the `remember` prop. */
    forcedRemember: RememberMode | undefined;
}) => {
    const { state, search } = useLocation<SignInLocationState | undefined>();
    const errorHandler = useErrorHandler();
    const [abuseModal, setAbuseModal] = useState<{ apiErrorMessage?: string } | undefined>(undefined);
    const machine = useSignInMachine({
        productParam,
        externalRedirect,
        onPreSubmit,
        onStartAuth,
        onLogin,
        onBack,
        paths,
    });

    useMetaTags(metaTags);

    const searchParams = new URLSearchParams(search);
    const rememberMode =
        forcedRemember ??
        // The initial search parameters are included to support the parameter being passed to /authorize
        getRememberModeSearchParameter(searchParams, initialSearchParams) ??
        remember;
    // The same "keep me signed in" choice the form uses, for the token the identity provider redirect hands over
    const { persistent } = useRememberPreference(rememberMode);
    const isPorkbun = searchParams.get('partner') === 'porkbun';

    const handleError = (error: any) => {
        if (error?.data?.Code === API_CUSTOM_ERROR_CODES.INBOX_DESKTOP_TRIAL_END) {
            // Signing in from Inbox desktop after its free trial ended: the desktop app shows the trial-ended screen
            endOfTrialIPCCall();
        }
        if (error?.data?.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
            setAbuseModal({ apiErrorMessage: getApiErrorMessage(error) });
        } else {
            errorHandler(error);
        }
    };

    const authTypeData = getInitialAuthTypeData(state, toApp);
    const externalSSOToken = authTypeData.type === AuthType.ExternalSSO ? state?.externalSSO?.token : undefined;

    return (
        <>
            <AbuseModal
                message={abuseModal?.apiErrorMessage}
                open={!!abuseModal}
                onClose={() => setAbuseModal(undefined)}
            />
            <SignInContext.Provider
                logic={machine}
                options={{
                    input: {
                        username:
                            state?.username ??
                            defaultUsername ??
                            getDefaultUsername(searchParams) ??
                            getDefaultUsername(initialSearchParams) ??
                            '',
                        authTypeData,
                        canNavigateBack: !!onBack,
                        setupVPN,
                        redirectsSSOToAccount,
                        externalSSO: externalSSOToken ? { token: externalSSOToken, persistent } : undefined,
                        showSSONotice:
                            authTypeData.type === AuthType.ExternalSSO &&
                            !externalSSOToken &&
                            state?.externalSSO?.flow === ExternalSSOFlow.Redirect,
                    },
                }}
            >
                <SignInProvider
                    layout={layout}
                    compactForm={compactForm}
                    toApp={toApp}
                    toAppName={toAppName}
                    showContinueTo={showContinueTo}
                    paths={paths}
                    remember={rememberMode}
                    testflight={testflight}
                    isPorkbun={isPorkbun}
                    onError={handleError}
                >
                    <SignInWizard />
                </SignInProvider>
            </SignInContext.Provider>
        </>
    );
};

/** Resolves the desktop-app specifics before the flow mounts. */
const SignInContainer = ({ layout, compactForm, ...props }: Props) => {
    const { isElectronDisabled } = useIsInboxElectronApp();
    // Inbox desktop builds that can't sign in here get a blocked screen instead of the flow
    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }
    return (
        <SignInFlow
            {...props}
            // The Pass desktop app gets its own compact page, unless the caller frames the flow itself
            layout={layout ?? (isElectronPass ? SignInPassDesktopLayout : SignInPageLayout)}
            compactForm={compactForm ?? isElectronPass}
            // Desktop apps always keep the session, without asking
            forcedRemember={isElectronApp ? RememberMode.HiddenEnabled : undefined}
        />
    );
};

export default SignInContainer;
