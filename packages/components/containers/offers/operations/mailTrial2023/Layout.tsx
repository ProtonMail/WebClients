import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/components/hooks';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import OfferTitle from '../../components/shared/OfferTitle';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    const [subscription] = useSubscription();
    const { PeriodEnd = 0 } = subscription || {};
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });
    const planName = PLAN_NAMES[PLANS.MAIL];

    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                {/* translator: the full sentence is: Your Mail Plus free trial ends on April 29th */}
                <OfferTitle>{c('Title').t`Your ${planName} free trial ends on ${textDate}`}</OfferTitle>
                <p className="text-center">{c('Info')
                    .t`Upgrade now to get premium features, products and storage at a special price`}</p>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center mb-4 color-weak">{c('specialoffer: Footer')
                    .t`This subscription will automatically renew every 2 years at the same rate until it is cancelled.`}</p>
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
