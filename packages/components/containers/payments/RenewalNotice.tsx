import { addMonths } from 'date-fns';
import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { Icon, Time } from '../../components';

export type Props = {
    /**
     * Number of months until renewal
     */
    renewCycle: number;
    className?: string;
};

const RenewalNotice = ({ renewCycle, className }: Props) => {
    const autoRenewal = <span className="text-bold" key="auto-renewal-label">{c('Info').t`Auto-renewal: `}</span>;
    const unixRenewalTime: number = +addMonths(new Date(), renewCycle) / 1000;
    const renewalTime = (
        <Time format="dd/MM/yyyy" key="auto-renewal-time">
            {unixRenewalTime}
        </Time>
    );

    return (
        <div className={clsx('flex flex-nowrap color-weak', className)}>
            <span className="flex-item-noshrink">
                <Icon name="info-circle" size={20} />
            </span>
            <span className="flex-item-fluid ml-2">{c('Info')
                .jt`${autoRenewal} your subscription will renew automatically on ${renewalTime}.`}</span>
        </div>
    );
};

export default RenewalNotice;
