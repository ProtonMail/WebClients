import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Time } from '@proton/components';
import { getBreachIcon } from '@proton/components/containers/credentialLeak/helpers';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import type { MonitorDomain } from '@proton/pass/lib/monitor/types';
import clsx from '@proton/utils/clsx';

import './BreachPreviewCard.scss';

type Props = { className?: string; preview: MonitorDomain; onUpsell: () => void };

export const BreachPreviewCard: FC<Props> = ({ className, preview, onUpsell }) => (
    <Card type="danger" className={clsx('relative', className)}>
        <PassPlusPromotionButton
            className="absolute right-custom top-custom"
            onClick={onUpsell}
            style={{
                '--top-custom': '8px',
                '--right-custom': '8px',
                '--background-norm': 'var(--pass-card-background)',
            }}
        />
        <CardContent
            title={c('Title').t`Breach detected`}
            titleClassname="text-lg text-bold"
            subtitle={c('Description').t`Your email addresses were leaked in at least 1 data breach.`}
            subtitleClassname="color-danger"
            className="mb-3"
        />
        <div className="flex items-center flex-nowrap gap-2 mb-3">
            <img src={getBreachIcon(1)} alt="" className="shrink-0" />
            <div className="flex flex-column flex-nowrap">
                <span className="text-ellipsis text-bold">{preview.domain}</span>
                <Time sameDayFormat={false}>{preview.breachedAt}</Time>
            </div>
        </div>
        <Card type="danger" className="pass-breach-preview">
            <div className="flex flex-column flex-nowrap">
                <span className="text-bold">{c('Label').t`Email address`}</span>
                <span className="blur-md">eric.norbert@proton.me</span>
                <span className="text-bold">{c('Label').t`Password`}</span>
                <span className="blur-md">3••••••••h</span>
            </div>
        </Card>

        <Button type="button" color="norm" pill onClick={onUpsell} className="w-full mt-4">
            {c('Action').t`View details`}
        </Button>
    </Card>
);
