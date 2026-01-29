import type { ReactElement } from 'react';

import { c } from 'ttag';

import {
    DropdownMenu,
    DropdownMenuButton,
    type OnLoginCallback,
    type OnLoginCallbackArguments,
    SimpleDropdown,
} from '@proton/components';
import Logo from '@proton/components/components/logo/Logo';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import ExploreAppsListV2, { getExploreApps } from '../components/ExploreAppsListV2/ExploreAppsListV2';
import Layout from './Layout';
import PublicUserItem from './PublicUserItem';

interface EnhancedAuthSession extends OnLoginCallbackArguments {
    data: OnLoginCallbackArguments['data'] & {
        Organization: OrganizationExtended | undefined;
    };
}

export type AppSwitcherState = {
    session: EnhancedAuthSession;
    error?: {
        type: 'unsupported-app';
        app: APP_NAMES;
    };
};

const Disabled = ({ children }: { children: ReactElement }) => {
    return (
        <div className="relative">
            <div
                style={{
                    filter: 'grayscale(100%)',
                    opacity: 0.5,
                }}
            >
                {children}
            </div>
            <IcCrossCircleFilled className="absolute color-danger top-0 right-0 bg-norm rounded-xl border border-transparent" />
        </div>
    );
};

export const UnsupportedAppError = ({ app, organization }: { app: APP_NAMES; organization?: OrganizationExtended }) => {
    const appName = getAppName(app);
    const organizationName = organization?.Name || '';
    return (
        <div
            className="flex flex-row items-center gap-2 px-3 py-2 border rounded bg-norm border-weak mb-6 mt-6"
            data-testid="app-unsupported"
        >
            <div className="shrink-0">
                <Disabled>
                    <Logo
                        appName={app}
                        size={15}
                        variant="glyph-only"
                        fallback={<ProtonLogo variant="glyph-only" size={15} />}
                    />
                </Disabled>
            </div>
            <div className="flex-1">
                {getBoldFormattedText(
                    organization && organizationName
                        ? c('Info').t`**${appName}** is not supported in your organization **${organizationName}**.`
                        : c('Info').t`**${appName}** is not supported.`
                )}
            </div>
        </div>
    );
};

interface Props {
    onLogin: OnLoginCallback;
    onSwitch: () => void;
    state: AppSwitcherState;
}

const AppSwitcherContainer = ({ onLogin, onSwitch, state }: Props) => {
    const session = state.session;
    const error = state.error;
    const { User, Organization, persistedSession } = session.data;

    const isDocsHomepageAvailable = useFlag('DriveDocsLandingPageEnabled');
    const isMeetAvailable = useFlag('PMVC2025');
    const isSheetsAvailable = useFlag('DocsSheetsEnabled');
    const isAuthenticatorAvailable = useFlag('AuthenticatorSettingsEnabled');
    const subscribed = User.Subscribed;

    return (
        <Layout
            toApp={undefined}
            hasDecoration={false}
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
        >
            <div>
                <header className="mt-6 mb-8 md:mb-10 lg:mb-20 text-center fade-in">
                    <h1 className="text-2xl md:text-6xl text-semibold mb-2">{c('Action').t`Welcome`}</h1>
                    <p className="m-0 md:text-lg color-weak">{c('Info').t`Privacy and security starts here`}</p>
                    {error?.type === 'unsupported-app' && (
                        <div className="mt-6 max-w-custom mx-auto" style={{ '--max-w-custom': '30rem' }}>
                            <UnsupportedAppError organization={Organization} app={error.app} />
                        </div>
                    )}
                </header>
                <div>
                    <ExploreAppsListV2
                        subscription={{ subscribed, plan: Organization?.PlanName }}
                        apps={getExploreApps({
                            user: User,
                            organization: Organization,
                            isDocsHomepageAvailable,
                            isSheetsAvailable,
                            oauth: persistedSession.source === SessionSource.Oauth,
                            isMeetAvailable,
                            isAuthenticatorAvailable,
                        })}
                        localID={persistedSession.localID}
                        onExplore={async (app) => {
                            await onLogin({
                                ...session,
                                appIntent: {
                                    app,
                                    ref: 'product-switch',
                                },
                            });
                        }}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default AppSwitcherContainer;
