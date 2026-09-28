import format from 'date-fns/format';
import { c } from 'ttag';

import { POSTED_INVOICE_BANNER_MAX_AGE, POSTED_INVOICE_BANNER_STORAGE_KEY } from '@proton/account/paymentsInit';
import { usePaymentsInit } from '@proton/account/paymentsInit/hooks';
import { useUser } from '@proton/account/user/hooks';
import { usePersistedState } from '@proton/hooks/usePersistedState';
import { dateLocale } from '@proton/shared/lib/i18n';

import SettingsLink from '../../components/link/SettingsLink';
import { getInvoicesPathname } from '../invoices/helpers';
import TopBanner from './TopBanner';

/**
 * Renders the posted-invoice reminder for users who can pay.
 *
 * Fetches payments init and shows the first posted invoice unless it was
 * dismissed within the last 25 days.
 */
const PostedInvoiceTopBannerContent = () => {
    const [init] = usePaymentsInit();

    const [dismissedFor, setDismissedFor] = usePersistedState<string>(POSTED_INVOICE_BANNER_STORAGE_KEY, {
        maxAge: POSTED_INVOICE_BANNER_MAX_AGE,
    });

    const invoice = init?.postedInvoices?.[0];
    if (!invoice || dismissedFor === invoice.id) {
        return null;
    }

    const dueDate = invoice.dueTime ? format(new Date(invoice.dueTime), 'PPP', { locale: dateLocale }) : undefined;

    const payInvoiceLink = (
        <SettingsLink key="pay-invoices" className="color-inherit" path={getInvoicesPathname()}>{c('Link')
            .t`Pay it`}</SettingsLink>
    );

    return (
        <TopBanner className="bg-info" data-testid="posted-invoice" onClose={() => setDismissedFor(invoice.id)}>
            {dueDate
                ? c('Info').jt`You have an open invoice on ${dueDate} ${payInvoiceLink}`
                : c('Info').jt`You have an open invoice ${payInvoiceLink}`}
        </TopBanner>
    );
};

/**
 * Top banner for a scheduled (posted) invoice, shown only to paying non-free users.
 *
 * Wraps {@link PostedInvoiceTopBannerContent} so payments init is not fetched for
 * members or free-plan users who cannot act on the reminder.
 */
export const PostedInvoiceTopBanner = () => {
    const [user] = useUser();

    if (!user.canPay || user.isFree) {
        return null;
    }

    return <PostedInvoiceTopBannerContent />;
};
