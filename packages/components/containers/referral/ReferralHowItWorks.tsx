import { c } from 'ttag';
import { Icon } from '@proton/components';
//import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
//import humanSize from '@proton/shared/lib/helpers/humanSize';

import './ReferralHowItWorks.scss';

const ReferralHowItWorks = () => {
    // const storageSize = humanSize(15 * 1024 ** 3, undefined, undefined, 0);
    return (
        <ul className="unstyled flex flex-column flex-nowrap steps-vertical">
            <li className="flex flex-nowrap flex-align-items-start steps-vertical-item steps-vertical-item--next-done">
                {' '}
                {/*  steps-vertical-item--next-done if next item is green */}
                <span className="flex-item-noshrink rounded-50 steps-vertical-icon-container flex bg-success">
                    {' '}
                    {/* bg-success is icon in green */}
                    <Icon name="checkmark" className="mauto" size={16} />
                </span>
                <span className="flex-item-fluid pl0-5 flex flex-column flex-nowrap relative steps-vertical-item-text color-disabled">
                    <span className="NOTHING IF IT'S DISABLED">{c('info').t`Choose a username`}</span>
                    <span className="text-sm">{c('info').t`You successfully selected your new email address.`}</span>
                </span>
            </li>
            <li className="flex flex-nowrap flex-align-items-start steps-vertical-item">
                <span className="flex-item-noshrink rounded-50 steps-vertical-icon-container flex bg-success">
                    <Icon name="lock" className="mauto" size={16} />
                </span>
                <span className="flex-item-fluid pl0-5 flex flex-column flex-nowrap relative steps-vertical-item-text">
                    <span className="text-semibold">{c('info').t`Today: get instant access`}</span>
                    <span className="text-sm color-weak">{c('info')
                        .t`15 GB secure mailbox with unlimited personalisation.`}</span>
                </span>
            </li>
            <li className="flex flex-nowrap flex-align-items-start steps-vertical-item">
                <span className="flex-item-noshrink rounded-50 bg-strong steps-vertical-icon-container flex">
                    <Icon name="bell" className="mauto" size={16} />
                </span>
                <span className="flex-item-fluid pl0-5 flex flex-column flex-nowrap relative steps-vertical-item-text">
                    <span className="text-semibold">{c('info').t`Day 24: Trial end reminder`}</span>
                    <span className="text-sm color-weak">{c('info').t`We’ll send you a notice. Cancel anytime.`}</span>
                </span>
            </li>
            <li className="flex flex-nowrap flex-align-items-start steps-vertical-item">
                <span className="flex-item-noshrink rounded-50 bg-strong steps-vertical-icon-container flex">
                    <Icon name="calendar-row" className="mauto" size={16} />
                </span>
                <span className="flex-item-fluid pl0-5 flex flex-column flex-nowrap relative steps-vertical-item-text">
                    <span className="text-semibold">{c('info').t`Day 30: Trial ends`}</span>
                    <span className="text-sm color-weak">
                        {c('info').t`Your subscription will start Jan 16th.`}
                        <br />
                        {c('info').t`Cancel anytime before`}
                    </span>
                </span>
            </li>
        </ul>
    );
};

export default ReferralHowItWorks;
