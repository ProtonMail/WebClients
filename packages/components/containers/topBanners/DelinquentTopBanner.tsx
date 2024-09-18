import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import { getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { UNPAID_STATE } from '@proton/shared/lib/constants';

import { useUser } from '../../hooks';
import TopBanner from './TopBanner';

const DelinquentTopBanner = () => {
    const [user] = useUser();

    if (!user.Delinquent) {
        return null;
    }
    const payInvoiceLink = (
        <SettingsLink key="pay-invoices" className="color-inherit" path={getInvoicesPathname()}>{c('Link')
            .t`Pay invoice`}</SettingsLink>
    );
    if (user.canPay) {
        if (user.Delinquent === UNPAID_STATE.DELINQUENT) {
            return (
                <TopBanner className="bg-danger" data-testid="unpaid-state">
                    {c('Info')
                        .jt`Your account has at least one overdue invoice. Your account is restricted. Continued non-payment will block your emails and sharing links. ${payInvoiceLink}`}
                </TopBanner>
            );
        }

        if (user.Delinquent === UNPAID_STATE.NO_RECEIVE) {
            return (
                <TopBanner className="bg-danger" data-testid="pay-invoice-alert">
                    {c('Info')
                        .jt`Your account has at least one overdue invoice. Your account is restricted, and all services are now blocked until payment. ${payInvoiceLink}`}
                </TopBanner>
            );
        }
        return (
            <TopBanner className="bg-danger" data-testid="restricted-state">
                {c('Info')
                    .jt`Your account has at least one overdue invoice. Your access will soon get restricted. ${payInvoiceLink}`}
            </TopBanner>
        );
    }
    if (user.isMember && user.Delinquent >= UNPAID_STATE.DELINQUENT) {
        return (
            <TopBanner className="bg-danger">
                {c('Info').t`Account access restricted due to unpaid invoices. Please contact your administrator.`}
            </TopBanner>
        );
    }
    return null;
};

export default DelinquentTopBanner;
