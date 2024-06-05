import { ReactNode } from 'react';

import { StandardErrorPage } from '@proton/components';
import { ProductParam } from '@proton/shared/lib/apps/product';

import AccountRecovery from './actions/AccountRecovery';
import DeleteAccount from './actions/DeleteAccount';
import LabelsSettings from './actions/LabelsSettings';
import MailSettings from './actions/MailSettings';
import SpamFiltersSettings from './actions/SpamFiltersSettings';
import SubscribeAccount from './actions/SubscribeAccount';
import SubscriptionDetails from './actions/SubscriptionDetails';
import { SupportedActions } from './helper';

interface Props {
    action: SupportedActions | null;
    redirect: string | undefined;
    app: ProductParam;
    searchParams: URLSearchParams;
    loader: ReactNode;
    layout: (children: ReactNode, props?: any) => ReactNode;
}

const MainContainer = ({ action, redirect, app, searchParams, loader, layout }: Props) => {
    if (!action || !Object.values<string>(SupportedActions).includes(action)) {
        return <StandardErrorPage>No action parameter found.</StandardErrorPage>;
    }

    return (
        <>
            {action === SupportedActions.MailSettings && <MailSettings layout={layout} />}
            {action === SupportedActions.LabelsSettings && <LabelsSettings layout={layout} />}
            {action === SupportedActions.SpamFiltersSettings && <SpamFiltersSettings layout={layout} />}
            {action === SupportedActions.AccountRecovery && <AccountRecovery layout={layout} />}
            {action === SupportedActions.SubscriptionDetails && <SubscriptionDetails layout={layout} />}
            {action === SupportedActions.DeleteAccount && <DeleteAccount />}
            {(action === SupportedActions.SubscribeAccount || action === SupportedActions.SubscribeAccountLink) && (
                <SubscribeAccount
                    app={app}
                    redirect={redirect}
                    searchParams={searchParams}
                    loader={loader}
                    layout={layout}
                />
            )}
        </>
    );
};

export default MainContainer;
