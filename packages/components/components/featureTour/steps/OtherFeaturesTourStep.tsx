import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons';
import { PLANS } from '@proton/payments';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayOtherFeaturesTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [organization] = await Promise.all([dispatch(organizationThunk())]);

    return [PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY].includes(organization.PlanName);
};

const OtherFeaturesTourStep = (props: FeatureTourStepProps) => {
    const features: { icon: IconName; title: string; content: string }[] = [
        {
            icon: 'clock',
            title: c('Title').t`Snooze:`,
            content: c('Info').t`Snooze messages for later so they are top of your inbox when you want`,
        },
        {
            icon: 'paper-plane-clock',
            title: c('Title').t`Schedule send:`,
            content: c('Info').t`Send messages at just the right now`,
        },
        {
            icon: 'earth',
            title: c('Title').t`Custom domains:`,
            content: c('Info').t`You can add your own custom domain to ${MAIL_APP_NAME}`,
        },
        {
            icon: 'speech-bubble',
            title: c('Title').t`Priority support:`,
            content: c('Info').t`Reach out to us for help on anything ${BRAND_NAME}.`,
        },
    ];

    return (
        <FeatureTourStepsContent
            title={c('Title').t`Other features included in your plan`}
            description={undefined}
            illustrationSize={undefined}
            illustration={undefined}
            titleClassName="pt-12"
            ctaText={c('Action').t`Got it`}
            {...props}
        >
            {features.map(({ icon, title, content }, index) => (
                <div
                    key={title}
                    className={clsx(
                        'flex flex-nowrap items-start justify-left',
                        index === features.length - 1 && 'mb-12 pb-4'
                    )}
                >
                    <div className="rounded-full bg-weak shrink-0 flex items-center justify-center p-2 mr-3">
                        <Icon name={icon} />
                    </div>
                    <p className="mt-0 mb-4">
                        {title} {content}
                    </p>
                </div>
            ))}
        </FeatureTourStepsContent>
    );
};

export default OtherFeaturesTourStep;
