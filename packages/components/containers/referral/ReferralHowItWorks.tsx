import { addMonths, format } from 'date-fns';
import { c } from 'ttag';

import { VerticalStep, VerticalSteps } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

export const ReferralHowItWorks = () => {
    // NOTE API plan to return subscription start date with GET /plans route
    const startDate = addMonths(new Date(), 1);
    const startText = format(startDate, 'PP', { locale: dateLocale });
    const planName = PLAN_NAMES[PLANS.MAIL];

    return (
        <VerticalSteps>
            <VerticalStep
                icon={<Icon name="checkmark" className="m-auto" size={4} />}
                title={c('info').t`Create an email address`}
                description={c('info').t`Your new email address is ready to go!`}
                status="passed"
            />
            <VerticalStep
                icon={<Icon name="lock" className="m-auto" size={4} />}
                title={c('info').t`Try ${planName}`}
                description={c('info').t`Enjoy secure, easy-to-use emailing with plenty of premium features.`}
                status="done"
            />
            <VerticalStep
                icon={<Icon name="bell" className="m-auto" size={4} />}
                title={c('info').t`Day 27: Trial reminder`}
                description={c('info').t`We'll email you before your trial ends. Cancel anytime.`}
            />
            <VerticalStep
                icon={<Icon name="calendar-today" className="m-auto" size={4} />}
                title={c('info').t`Day 30: Trial ends`}
                // translator: Your subscription starts on Apr 29, 1453.
                description={c('info').t`Your subscription starts on ${startText}.`}
            />
        </VerticalSteps>
    );
};
