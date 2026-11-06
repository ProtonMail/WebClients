import forgotUsernamePage from '../../../pages/forgot-username';
import { usePublicAppAuth } from '../publicAppAuth';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { selectPaths, selectPreAppIntent } from '../state-machine/publicAppStateMachine';
import ForgotUsernameContainer from './ForgotUsernameContainer';

const PublicAppForgotUsername = () => {
    const { onStartAuth } = usePublicAppAuth();
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const loginPath = PublicAppContext.useSelector((state) => selectPaths(state).login);

    return (
        <ForgotUsernameContainer
            toApp={toApp}
            metaTags={forgotUsernamePage()}
            loginUrl={loginPath}
            onStartAuth={onStartAuth}
        />
    );
};

export default PublicAppForgotUsername;
