import { StandardErrorPage } from '@proton/components';
import { APP_NAMES } from '@proton/shared/lib/constants';

import DeleteAccount from './actions/DeleteAccount';
import SubscribeAccount from './actions/SubscribeAccount';
import { SupportedActions } from './helper';

interface Props {
    action: SupportedActions | null;
    redirect: string | undefined;
    app: APP_NAMES;
    searchParams: URLSearchParams;
}

const MainContainer = ({ action, redirect, app, searchParams }: Props) => {
    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return (
        <>
            {action === SupportedActions.DeleteAccount && <DeleteAccount />}
            {(action === SupportedActions.SubscribeAccount || action === SupportedActions.SubscribeAccountLink) && (
                <SubscribeAccount app={app} redirect={redirect} queryParams={searchParams} />
            )}
        </>
    );
};

export default MainContainer;
