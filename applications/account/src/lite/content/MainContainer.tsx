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

    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return (
        <>
            {action === SupportedActions.DeleteAccount && <DeleteAccount />}
            {action === SupportedActions.SubscribeAccount && (
                <SubscriptionModalProvider>
                    <SubscribeAccount client={client} />
                </SubscriptionModalProvider>
            )}
        </>
    );
};

export default MainContainer;
