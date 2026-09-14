import type { FunctionComponent } from 'react';
import { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer';
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea';
import TopBanners from '@proton/components/containers/topBanners/TopBanners';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useToggle from '@proton/hooks/useToggle';
import { APPS } from '@proton/shared/lib/constants';

import { ConsoleSidebar } from './ConsoleSidebar';
import { getRoutes } from './routes';

const app = APPS.PROTONCONSOLE;

const Placeholder = ({ title }: { title: string }) => (
    <PrivateMainArea>
        <div className="p-4 lg:p-6">
            <h2 className="text-bold text-2xl mb-2">{title}</h2>
            <p className="color-weak m-0">This is not a Console!</p>
        </div>
    </PrivateMainArea>
);

const MainContainer: FunctionComponent = () => {
    const location = useLocation();
    const { viewportWidth } = useActiveBreakpoint();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const routes = getRoutes();

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    return (
        <PrivateAppContainer
            top={<TopBanners app={app} />}
            header={
                <PrivateHeader
                    app={app}
                    userDropdown={<UserDropdown app={app} />}
                    hideUpsellButton
                    hideSettingsButton
                    title="Console"
                    expanded={expanded}
                    onToggleExpand={onToggleExpand}
                    isSmallViewport={viewportWidth['<=small']}
                />
            }
            sidebar={<ConsoleSidebar routes={routes} expanded={expanded} onToggleExpand={onToggleExpand} />}
        >
            <Switch>
                {routes.map((route) => (
                    <Route path={route.to} key={route.to}>
                        <Placeholder title={route.text} />
                    </Route>
                ))}
                <Redirect to={routes[0].to} />
            </Switch>
        </PrivateAppContainer>
    );
};

export default MainContainer;
