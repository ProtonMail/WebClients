import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { selectOrgTOTPDisabled } from '../../store/selectors/organization';
import { truthy } from '../../utils/fp/predicates';
import { Content } from '../Layout/Section/Content';
import { SubSidebar } from '../Layout/Section/SubSidebar';
import { ItemSwitch } from '../Navigation/ItemSwitch';
import { removeLocalPath } from '../Navigation/routing';
import { Missing2FAs } from './2FA/Missing2FAs';
import { DarkWebMonitoring } from './Breach/DarkWebMonitoring';
import { ExcludedItems } from './Item/ExcludedItems';
import { MonitorProvider } from './MonitorProvider';
import { MonitorSummary } from './MonitorSummary';
import { CompromisedPasswords } from './Password/CompromisedPasswords';
import { DuplicatePasswords } from './Password/DuplicatePasswords';
import { WeakPasswords } from './Password/WeakPasswords';

export const Monitor: FC<RouteChildrenProps> = ({ match }) => {
    const orgTOTPDisabled = useSelector(selectOrgTOTPDisabled);
    const itemReportPaths = ['duplicates', !orgTOTPDisabled && '2fa', 'weak', 'compromised', 'excluded']
        .filter(truthy)
        .join('|');

    return (
        <MonitorProvider>
            <SubSidebar>
                <Switch>
                    <Route path={`${match?.path}/duplicates`} component={DuplicatePasswords} />
                    {!orgTOTPDisabled && <Route path={`${match?.path}/2fa`} component={Missing2FAs} />}
                    <Route path={`${match?.path}/weak`} component={WeakPasswords} />
                    <Route path={`${match?.path}/compromised`} component={CompromisedPasswords} />
                    <Route path={`${match?.path}/excluded`} component={ExcludedItems} />
                    <Route path={`${match?.path}/dark-web`} component={DarkWebMonitoring} />
                    <Route component={MonitorSummary} />
                </Switch>
            </SubSidebar>
            <Switch>
                <Route path={`${match?.path}/(${itemReportPaths})`}>
                    {(subRoute) => {
                        const { match } = subRoute;
                        if (!match) return null;

                        return (
                            <Content>
                                <ItemSwitch prefix={removeLocalPath(match.url)} {...subRoute} />
                            </Content>
                        );
                    }}
                </Route>
            </Switch>
        </MonitorProvider>
    );
};
