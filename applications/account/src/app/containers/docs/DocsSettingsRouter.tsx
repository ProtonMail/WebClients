import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { CommentEmailSection, PrivateMainSettingsArea } from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import type { getDocsAppRoutes } from './routes';

const DocsSettingsRouter = ({
    docsAppRoutes,
    redirect,
}: {
    docsAppRoutes: ReturnType<typeof getDocsAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { comments },
    } = docsAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, comments)}>
                <PrivateMainSettingsArea config={comments}>
                    <CommentEmailSection />
                </PrivateMainSettingsArea>
            </Route>

            {redirect}
        </Switch>
    );
};

export default DocsSettingsRouter;
