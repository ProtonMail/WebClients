import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import shield from '../../../../assets/monitor/shield-bolt.svg';
import { Card } from '../../../Layout/Card/Card';
import { CardContent } from '../../../Layout/Card/CardContent';
import { PassPlusPromotionButton } from '../../../Upsell/PassPlusPromotionButton';

type Props = { className?: string; onUpsell: () => void };

export const BreachUpsellCard: FC<Props> = ({ className, onUpsell }) => (
    <Card type="primary" className={clsx('relative', className)}>
        <div
            className="absolute right-custom top-custom"
            style={{
                '--top-custom': '8px',
                '--right-custom': '8px',
                '--background-norm': 'var(--pass-card-background)',
            }}
        >
            <PassPlusPromotionButton onClick={onUpsell} />
        </div>
        <CardContent
            title={DARK_WEB_MONITORING_NAME}
            titleClassname="text-lg text-bold"
            subtitle={c('Description').t`Get notified if your email, password or other personal data was leaked.`}
            subtitleClassname="color-norm-major"
            icon={() => <img src={shield} alt="" className="shrink-0" />}
        />
        <Button type="button" color="norm" pill onClick={onUpsell} className="w-full mt-4">
            {c('Action').t`Enable ${DARK_WEB_MONITORING_NAME}`}
        </Button>
    </Card>
);
