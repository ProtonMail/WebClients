import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Content } from '@proton/pass/components/Layout/Section/Content';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { Missing2FAs } from '@proton/pass/components/Monitor/2FA/Missing2FAs';
import { DuplicatePasswords } from '@proton/pass/components/Monitor/Password/DuplicatePasswords';
import { WeakPasswords } from '@proton/pass/components/Monitor/Password/WeakPasswords';
import { Summary } from '@proton/pass/components/Monitor/Summary';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';
import { removeLocalPath } from '@proton/pass/components/Navigation/routing';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const Monitor: FC<RouteChildrenProps> = ({ match }) => {
    const enabled = useFeatureFlag(PassFeature.PassMonitor);

    return (
        enabled && (
            <>
                <SubSidebar>
                    <Switch>
                        <Route path={`${match?.path}/duplicates`} component={DuplicatePasswords} />
                        <Route path={`${match?.path}/2fa`} component={Missing2FAs} />
                        <Route path={`${match?.path}/weak`} component={WeakPasswords} />
                        <Route component={Summary} />
                    </Switch>
                </SubSidebar>
                <Switch>
                    <Route path={`${match?.path}/(duplicates|2fa|weak)`}>
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
            </>
        )
    );
};
