import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import shieldDanger from '@proton/pass/assets/monitor/shield-bolt-danger.svg';
import shield from '@proton/pass/assets/monitor/shield-bolt.svg';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan } from '@proton/pass/store/selectors';

type Props = { breached: boolean; onUpsell: () => void };

export const DarkWeb: FC<Props> = ({ breached, onUpsell }) => {
    const plan = useSelector(selectPassPlan);

    return (
        <Card
            className="flex gap-4 flex-columns"
            type={breached ? 'danger' : 'success'}
            style={{ '--pass-card-content-title': 'var(--text-norm)' }}
        >
            <CardContent
                title={breached ? c('Title').t`Breach detected` : c('Title').t`Dark Web Monitoring`}
                subtitle={
                    breached
                        ? c('Description').t`Your personal info was leaked in a data breach of a third-party service.`
                        : c('Description').t`Get notified if your email, password or other personal data was leaked.`
                }
                titleClassname="text-lg text-bold mb-1"
                icon={() => <img src={breached ? shieldDanger : shield} alt="" className="shrink-0" />}
            />
            <Button
                type="submit"
                color="norm"
                pill
                className="w-full"
                onClick={!isPaidPlan(plan) ? onUpsell : onUpsell}
            >
                {breached ? c('Action').t`View details` : c('Action').t`Enable Dark Web Monitoring`}
            </Button>
        </Card>
    );
};
