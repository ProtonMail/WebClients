import { c } from 'ttag';
import { VerticalSteps, VerticalStep } from '@proton/atoms/VerticalSteps';
import { addMonths, format } from 'date-fns';
import { dateLocale } from '@proton/shared/lib/i18n';

const ReferralHowItWorks = () => {
    // NOTE API plan to return subscription start date with GET /plans route
    const startDate = addMonths(new Date(), 1);
    const startText = format(startDate, 'PP', { locale: dateLocale });

    return (
        <VerticalSteps>
            <VerticalStep
                icon="checkmark"
                title={c('info').t`Create an email address`}
                description={c('info').t`Your new email address is ready to go!`}
                status="passed"
            />
            <VerticalStep
                icon="lock"
                title={c('info').t`Try Mail Plus`}
                description={c('info').t`Enjoy secure, easy-to-use emailing with plenty of premium features.`}
                status="done"
            />
            <VerticalStep
                icon="bell"
                title={c('info').t`Day 27: Trial reminder`}
                description={c('info').t`We’ll email you before your trial ends. Cancel anytime.`}
            />
            <VerticalStep
                icon="calendar-today"
                title={c('info').t`Day 30: Trial ends`}
                // translator: Your subscription starts on Apr 29, 1453.
                description={c('info').t`Your subscription starts on ${startText}.`}
            />
        </VerticalSteps>
    );
};

export default ReferralHowItWorks;
