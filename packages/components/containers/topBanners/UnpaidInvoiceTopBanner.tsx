import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { getInvoicesPathname } from '@proton/shared/lib/apps/helper';

import TopBanner from './TopBanner';

const UnpaidInvoiceTopBanner = () => {
    const [user] = useUser();

    if (!user.Delinquent) {
        return null;
    }

    if (user.canPay) {
        const payInvoiceLink = (
            <SettingsLink key="pay-invoices" className="color-inherit" path={getInvoicesPathname()}>{c('Link')
                .t`Pay invoice`}</SettingsLink>
        );

        return (
            <TopBanner className="bg-danger" data-testid="restricted-state">
                {c('Info')
                    .jt`Your account has at least one overdue invoice. Your access will soon get restricted. ${payInvoiceLink}`}
            </TopBanner>
        );
    }

    return null;
};

export default UnpaidInvoiceTopBanner;
