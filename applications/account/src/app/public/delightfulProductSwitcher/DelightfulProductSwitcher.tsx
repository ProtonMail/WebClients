import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton, type OnLoginCallback, SimpleDropdown } from '@proton/components';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { useFlag } from '@proton/unleash';

import ExploreAppsListV2, { getExploreApps } from '../../components/ExploreAppsListV2/ExploreAppsListV2';
import { type AppSwitcherState, UnsupportedAppError } from '../AppSwitcherContainer';
import Layout from '../Layout';
import PublicUserItem from '../PublicUserItem';

interface Props {
    onLogin: OnLoginCallback;
    onSwitch: () => void;
    state: AppSwitcherState;
}

const DelightfulProductSwitcher = ({ onLogin, onSwitch, state }: Props) => {
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
                    <p className="m-0 md:text-lg color-weak">{c('Info').t`Select a service to continue`}</p>
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

export default DelightfulProductSwitcher;
