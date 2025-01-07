import { memo } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import { DeepLinks } from 'proton-pass-web/app/DeepLinks/DeepLinks';

import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { Items } from '@proton/pass/components/Item/Items';
import { PremiumRoutes, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

import { Monitor } from './Monitor/Monitor';
import { Onboarding } from './Onboarding/Onboarding';
import { Settings } from './Settings/Settings';

export const PrivateRouter = memo(() => {
    const free = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const localID = useAuthStore()?.getLocalID();

    return (
        <Route path={`/${getLocalIDPath(localID)}`}>
            {({ match }) =>
                match && (
                    <Switch>
                        {[
                            free && (
                                <Route key="premium" path={PremiumRoutes.map((path) => `${match.path}/${path}`)}>
                                    <Redirect to={getLocalPath()} push={false} />
                                </Route>
                            ),
                            <Route key="onboarding" path={`${match.path}/onboarding`} component={Onboarding} exact />,
                            <Route key="monitor" path={`${match.path}/monitor`} component={Monitor} />,
                            <Route key="settings" path={`${match.path}/settings`} component={Settings} exact />,
                            <Route key="deep-links" path={`${match.path}/internal/:key`} component={DeepLinks} />,
                            <Route key="items" component={Items} />,
                        ].filter(truthy)}
                    </Switch>
                )
            }
        </Route>
    );
});

PrivateRouter.displayName = 'RoutesMemo';
