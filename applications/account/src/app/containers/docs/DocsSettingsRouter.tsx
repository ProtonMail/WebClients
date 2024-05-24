import { ReactNode } from 'react';
import { Switch } from 'react-router-dom';

import type { getDocsAppRoutes } from './routes';

const DocsSettingsRouter = ({
    redirect,
}: {
    docsAppRoutes: ReturnType<typeof getDocsAppRoutes>;
    redirect: ReactNode;
}) => {
    return <Switch>{redirect}</Switch>;
};

export default DocsSettingsRouter;
