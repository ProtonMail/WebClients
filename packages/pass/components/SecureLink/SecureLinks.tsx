import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Content } from '@proton/pass/components/Layout/Section/Content';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';
import { getLocalPath, removeLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import { SecureLinkItemsList } from './SecureLinkItemsList';

export const SecureLinks: FC<RouteChildrenProps> = ({ match }) => {
    const passPlan = useSelector(selectPassPlan);

    return passPlan !== UserPassPlan.FREE && match ? (
        <>
            <SubSidebar>
                <SecureLinkItemsList />
            </SubSidebar>
            <Switch>
                <Route path={`${match?.path}`}>
                    {(subRoute) => {
                        if (!subRoute.match) return null;

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
    ) : (
        <Redirect to={getLocalPath()} push={false} />
    );
};
