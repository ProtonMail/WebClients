import { c } from 'ttag';

import { DropdownMenu, Icon, SimpleDropdown } from '@proton/components/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { OnLoginCallback, OnLoginCallbackArguments } from '@proton/components/containers';
import type { Organization } from '@proton/shared/lib/interfaces';

import ExploreAppsList, { getExploreApps } from '../signup/ExploreAppsList';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import PublicUserItem from './PublicUserItem';

export type AppSwitcherState = {
    session: OnLoginCallbackArguments & { Organization: Organization | undefined };
};

interface Props {
    onLogin: OnLoginCallback;
    onSwitch: () => void;
    state: AppSwitcherState;
}

const AppSwitcherContainer = ({ onLogin, onSwitch, state }: Props) => {
    const session = state.session;
    const { User, Organization } = session;

    const subscribed = User.Subscribed;

    return (
        <Layout
            hasDecoration={false}
            topRight={
                <SimpleDropdown
                    as={PublicUserItem}
                    originalPlacement="bottom-end"
                    title={c('Title').t`Open actions dropdown`}
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
                <Header title={c('Action').t`Welcome`} subTitle={c('Info').t`Choose an app to get started`} />
                <Content>
                    <ExploreAppsList
                        subscription={{ subscribed, plan: Organization?.PlanName }}
                        apps={getExploreApps({ subscribed, user: User })}
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
