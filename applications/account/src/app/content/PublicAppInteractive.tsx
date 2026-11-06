import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';

import AccountLoaderPage from './AccountLoaderPage';
import PublicAppMainRoutes from './PublicAppMainRoutes';
import PublicAppStandaloneRoutes from './PublicAppStandaloneRoutes';
import { PublicAppContext } from './state-machine/PublicAppContext';

const PublicAppInteractive = () => {
    const errorMessage = PublicAppContext.useSelector((state) => state.context.errorMessage);
    const isBlocking = PublicAppContext.useSelector((state) => state.hasTag('blocking'));

    const loadingPage =
        errorMessage === undefined ? <AccountLoaderPage /> : <StandardLoadErrorPage errorMessage={errorMessage} />;

    return <PublicAppStandaloneRoutes>{isBlocking ? loadingPage : <PublicAppMainRoutes />}</PublicAppStandaloneRoutes>;
};

export default PublicAppInteractive;
