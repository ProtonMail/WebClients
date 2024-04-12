import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import shieldDanger from '@proton/pass/assets/monitor/shield-bolt-danger.svg';
import shield from '@proton/pass/assets/monitor/shield-bolt.svg';
import { InfoCard } from '@proton/pass/components/Layout/Card/InfoCard';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan } from '@proton/pass/store/selectors';
import clsx from '@proton/utils/clsx';

type Props = { breached: boolean; onUpsell: () => void };

export const DarkWeb: FC<Props> = ({ breached, onUpsell }) => {
    const plan = useSelector(selectPassPlan);

    return (
        <InfoCard
            className={clsx('bg-weak rounded-xl border border-norm p-6', breached && 'ui-red')}
            title={breached ? c('Title').t`Breach detected` : c('Title').t`Dark Web Monitoring`}
            titleClassname="text-lg text-bold mb-1"
            subtitle={
                breached
                    ? c('Description').t`Your personal info was leaked in a data breach of a third-party service.`
                    : c('Description').t`Get notified if your email, password or other personal data was leaked.`
            }
            subtitleClassname={breached ? 'color-danger' : 'color-norm-major'}
            icon={() => <img src={breached ? shieldDanger : shield} alt="" className="shrink-0" />}
            actions={
                <Button
                    type="submit"
                    color="norm"
                    pill
                    onClick={!isPaidPlan(plan) ? onUpsell : onUpsell}
                    className="w-full"
                >
                    {breached ? c('Action').t`View details` : c('Action').t`Enable Dark Web Monitoring`}
                </Button>
            }
        />
    );
};
