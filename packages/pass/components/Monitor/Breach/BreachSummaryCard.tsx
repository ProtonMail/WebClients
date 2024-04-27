import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import shieldDanger from '@proton/pass/assets/monitor/shield-bolt-danger.svg';
import { ButtonCard } from '@proton/pass/components/Layout/Card/ButtonCard';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';

type Props = { className?: string; breached: boolean; onClick: () => void };

export const BreachSummaryCard: FC<Props> = ({ className, breached, onClick }) => {
    if (!breached) {
        return (
            <ButtonCard
                className={className}
                onClick={onClick}
                title={c('Title').t`Dark web monitoring`}
                subtitle="No breaches detected"
                icon="checkmark"
                type="success"
            />
        );
    }

    return (
        <Card type="danger" className={className}>
            <CardContent
                title={c('Title').t`Breach detected`}
                titleClassname="text-lg text-bold"
                subtitle={c('Description').t`Your personal info was leaked in a data breach of a third-party service.`}
                subtitleClassname="color-danger"
                icon={() => <img src={shieldDanger} alt="" className="shrink-0" />}
            />
            <Button type="button" color="norm" pill onClick={onClick} className="w-full mt-4">
                {c('Action').t`View details`}
            </Button>
        </Card>
    );
};
