import { type ReactElement } from 'react';

import { c } from 'ttag';

import {
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    type OnLoginCallback,
    type OnLoginCallbackArguments,
    SimpleDropdown,
} from '@proton/components';
import Logo from '@proton/components/components/logo/Logo';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationWithSettings } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import ExploreAppsList, { getExploreApps } from '../signup/ExploreAppsList';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import PublicUserItem from './PublicUserItem';

interface EnhancedAuthSession extends OnLoginCallbackArguments {
    data: OnLoginCallbackArguments['data'] & {
        Organization: OrganizationWithSettings | undefined;
    };
}

export type AppSwitcherState = {
    session: EnhancedAuthSession;
    error?: {
        type: 'unsupported-app';
        app: APP_NAMES;
        message: string;
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
            <Icon
                className="absolute color-danger top-0 right-0 bg-norm rounded-xl border border-transparent"
                name="cross-circle-filled"
            />
        </div>
    );
};

const UnsupportedAppError = ({ app, organization }: { app: APP_NAMES; organization?: OrganizationWithSettings }) => {
    const appName = getAppName(app);
    const organizationName = organization?.Name || '';
    return (
        <div className="flex flex-row items-center gap-2 px-3 py-2 border rounded border-weak mb-6 mt-6">
            <div className="shrink-0">
                <Disabled>
                    <Logo appName={app} size={15} variant="glyph-only" />
                </Disabled>
            </div>
            <div className="flex-1">
                {getBoldFormattedText(
                    c('Info').t`**${appName}** is not supported in your organization **${organizationName}**.`
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

    const isLumoAvailable = useFlag('LumoInProductSwitcher');
    const isAccessControlEnabled = useFlag('AccessControl');

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
                            <Icon name="plus" />
                            {c('Action').t`Switch or add account`}
                        </DropdownMenuButton>
                    </DropdownMenu>
                </SimpleDropdown>
            }
        >
            <Main>
                <Header
                    title={c('Action').t`Welcome`}
                    belowTitle={
                        error?.type === 'unsupported-app' && (
                            <UnsupportedAppError organization={Organization} app={error.app} />
                        )
                    }
                    subTitle={c('Info').t`Select a service to continue`}
                />
                <Content>
                    <ExploreAppsList
                        subscription={{ subscribed, plan: Organization?.PlanName }}
                        apps={getExploreApps({
                            subscribed,
                            user: User,
                            organization: Organization,
                            isLumoAvailable,
                            isAccessControlEnabled,
                            oauth: persistedSession.source === SessionSource.Oauth,
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
                </Content>
            </Main>
        </Layout>
    );
};

export default AppSwitcherContainer;
