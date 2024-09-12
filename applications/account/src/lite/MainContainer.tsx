import type { ReactNode } from 'react';

import { StandardErrorPage } from '@proton/components';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import AccountSettings from './actions/AccountSettings';
import DeleteAccount from './actions/DeleteAccount';
import EmailSettings from './actions/EmailSettings';
import LabelsSettings from './actions/LabelsSettings';
import PrivacySecuritySettings from './actions/PrivacySecuritySettings';
import SpamFiltersSettings from './actions/SpamFiltersSettings';
import SubscribeAccount from './actions/SubscribeAccount';
import WalletSettings from './actions/WalletSettings';
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
            {action === SupportedActions.WalletSettings && <WalletSettings loader={loader} layout={layout} />}
            {action === SupportedActions.AccountSettings && <AccountSettings layout={layout} loader={loader} />}
            {action === SupportedActions.EmailSettings && <EmailSettings layout={layout} loader={loader} />}
            {action === SupportedActions.LabelsSettings && <LabelsSettings layout={layout} />}
            {action === SupportedActions.SpamFiltersSettings && <SpamFiltersSettings layout={layout} />}
            {action === SupportedActions.PrivacySecuritySettings && (
                <PrivacySecuritySettings layout={layout} loader={loader} />
            )}
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
