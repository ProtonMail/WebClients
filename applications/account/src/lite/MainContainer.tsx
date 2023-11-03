import { StandardErrorPage } from '@proton/components';
import { ProductParam } from '@proton/shared/lib/apps/product';

import DeleteAccount from './actions/DeleteAccount';
import SubscribeAccount from './actions/SubscribeAccount';
import { SupportedActions } from './helper';

interface Props {
    action: SupportedActions | null;
    redirect: string | undefined;
    app: ProductParam;
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
                <SubscribeAccount app={app} redirect={redirect} searchParams={searchParams} />
            )}
        </>
    );
};

export default MainContainer;
