import resetPasswordPage from '../../../pages/reset-password';
import type { OnLoginCallback } from '../authSession';
import { setupVPN, usePublicAppAuth } from '../publicAppAuth';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { selectPaths, selectPreAppIntent } from '../state-machine/publicAppStateMachine';
import { runLogin } from '../state-machine/runLogin';
import { ResetPasswordPage } from './ResetPasswordPage';

const PublicAppResetPassword = () => {
    const { onPreSubmit, onStartAuth } = usePublicAppAuth();
    const publicApp = PublicAppContext.useActorRef();
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const loginPath = PublicAppContext.useSelector((state) => selectPaths(state).login);
    const productParam = PublicAppContext.useSelector((state) => state.context.productParam);
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);

    return (
        <ResetPasswordPage
            metaTags={resetPasswordPage()}
            toApp={toApp}
            onLogin={onLogin}
            setupVPN={setupVPN}
            loginUrl={loginPath}
            productParam={productParam}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
        />
    );
};

export default PublicAppResetPassword;
