import { StandardErrorPage, SubscriptionModalProvider } from '@proton/components';
import DeleteAccount from '../containers/DeleteAccount';
import SubscribeAccount from '../containers/SubscribeAccount';

enum SupportedActions {
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
}

const MainContainer = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const action = queryParams.get('action');
    const client = queryParams.get('client');
    const defaultValues =
        {
            macOS: {
                redirect: 'protonvpn://refresh',
                fullscreen: 'off',
            },
        }[client || ''] || {};
    const redirect = queryParams.get('redirect') || defaultValues.redirect || undefined;
    const fullscreen = (queryParams.get('fullscreen') || defaultValues.fullscreen || undefined) !== 'off';

    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return (
        <>
            {action === SupportedActions.DeleteAccount && <DeleteAccount />}
            {action === SupportedActions.SubscribeAccount && (
                <SubscriptionModalProvider>
                    <SubscribeAccount redirect={redirect} fullscreen={fullscreen} />
                </SubscriptionModalProvider>
            )}
        </>
    );
};

export default MainContainer;
