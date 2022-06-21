import { c } from 'ttag';
import { VerticalSteps, VerticalStep } from '@proton/atoms/VerticalSteps';
import { addMonths, format } from 'date-fns';
import { dateLocale } from '@proton/shared/lib/i18n';

const ReferralHowItWorks = () => {
    const endDate = addMonths(new Date(), 1);
    const endText = format(endDate, 'PP', { locale: dateLocale });

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
                description={c('info').t`Your subscription starts on ${endText}.`}
            />
        </VerticalSteps>
    );
};

export default ReferralHowItWorks;
