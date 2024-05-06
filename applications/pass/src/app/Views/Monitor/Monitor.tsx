import { type FC } from 'react';
import { Redirect, Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Content } from '@proton/pass/components/Layout/Section/Content';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { Missing2FAs } from '@proton/pass/components/Monitor/2FA/Missing2FAs';
import { DarkWebMonitoring } from '@proton/pass/components/Monitor/Breach/DarkWebMonitoring';
import { ExcludedItems } from '@proton/pass/components/Monitor/Item/ExcludedItems';
import { MonitorProvider } from '@proton/pass/components/Monitor/MonitorProvider';
import { MonitorSummary } from '@proton/pass/components/Monitor/MonitorSummary';
import { DuplicatePasswords } from '@proton/pass/components/Monitor/Password/DuplicatePasswords';
import { WeakPasswords } from '@proton/pass/components/Monitor/Password/WeakPasswords';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';
import { getLocalPath, removeLocalPath } from '@proton/pass/components/Navigation/routing';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const Monitor: FC<RouteChildrenProps> = ({ match }) => {
    const enabled = useFeatureFlag(PassFeature.PassMonitor);

    return enabled ? (
        <MonitorProvider>
            <SubSidebar>
                <Switch>
                    <Route path={`${match?.path}/duplicates`} component={DuplicatePasswords} />
                    <Route path={`${match?.path}/2fa`} component={Missing2FAs} />
                    <Route path={`${match?.path}/weak`} component={WeakPasswords} />
                    <Route path={`${match?.path}/excluded`} component={ExcludedItems} />
                    <Route path={`${match?.path}/dark-web`} component={DarkWebMonitoring} />
                    <Route component={MonitorSummary} />
                </Switch>
            </SubSidebar>
            <Switch>
                <Route path={`${match?.path}/(duplicates|2fa|weak|excluded)`}>
                    {(subRoute) => {
                        const { match } = subRoute;
                        if (!match) return null;

                        return (
                            <Content>
                                <ItemSwitch
                                    prefix={removeLocalPath(match.url)}
                                    fallback={() => <div />}
                                    {...subRoute}
                                />
                            </Content>
                        );
                    }}
                </Route>
            </Switch>
        </MonitorProvider>
    ) : (
        <Redirect to={getLocalPath()} push={false} />
    );
};
