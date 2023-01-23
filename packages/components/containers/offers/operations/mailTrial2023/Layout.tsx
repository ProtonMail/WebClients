import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/components/hooks';
import { dateLocale } from '@proton/shared/lib/i18n';

import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    const [subscription] = useSubscription();
    const { PeriodEnd = 0 } = subscription;
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });

    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <h1 className="h2 text-center text-bold">{c('Title')
                    .t`Your Mail Plus free trial ends on ${textDate}`}</h1>
                <p>{c('Info').t`Upgrade now to get premium features, products and storage at a special price`}</p>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center mb1 color-weak">{c('specialoffer: Footer')
                    .t`This subscription will automatically renew every 2 years at the same rate until it is cancelled.`}</p>
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
