import { StandardErrorPage } from '@proton/components';
import DeleteAccount from '../containers/DeleteAccount';

enum SupportedActions {
    DeleteAccount = 'delete-account',
}

const MainContainer = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const action = queryParams.get('action');

    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return <div>{action === SupportedActions.DeleteAccount && <DeleteAccount />}</div>;
};

export default MainContainer;
