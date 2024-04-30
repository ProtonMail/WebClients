import { type FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import { PASS_SENTINEL_LINK } from '@proton/pass/constants';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { UpsellType } from './UpsellingModal';

type Props = { upsellType: UpsellType };
type UpsellFeature = { key: UpsellFeatureName; className: string; icon: IconName; label: string | string[] };

export type UpsellFeatureName = 'aliases' | '2FA' | 'logins' | 'sentinel';

const PROTON_SENTINEL_LINK = (
    <a href={PASS_SENTINEL_LINK} target="_blank" key="sentinel-link">
        {PROTON_SENTINEL_NAME}
    </a>
);

const getFeatures = (): UpsellFeature[] => [
    {
        key: 'aliases',
        className: 'ui-teal',
        icon: 'alias',
        label: c('Info').t`Unlimited hide-my-email aliases`,
    },
    {
        key: '2FA',
        className: 'ui-orange',
        icon: 'pass-circles',
        label: c('Info').t`Built in 2FA authenticator`,
    },
    {
        key: 'logins',
        className: 'ui-red',
        icon: 'users-plus',
        label: c('Info').t`Share your logins, secure notes, with up to 10 people`,
    },
    {
        key: 'sentinel',
        className: 'ui-lime',
        icon: 'list-bullets',
        label:
            // translator: full sentence is Protected by Proton Sentinel, our advanced account protection program
            c('Info').jt`Protected by ${PROTON_SENTINEL_LINK}, our advanced account protection program`,
    },
];

export const UpsellFeatures: FC<Props> = ({ upsellType }) => {
    const features = getFeatures();

    return (
        <Card
            rounded
            bordered={false}
            className="w-full m-auto rounded-lg"
            style={{ backgroundColor: 'var(--field-norm)', padding: '0 1rem' }}
        >
            {/* We do not show aliases, and protected only for free-trial */}
            {features
                .filter(({ key }) => !((key === 'aliases' || key === 'sentinel') && upsellType === 'free-trial'))
                .map(({ className, icon, label, key }, idx) => (
                    <div
                        className={clsx(
                            'flex justify-start items-center py-3 gap-3',
                            idx < features.length - 1 && 'border-bottom',
                            className
                        )}
                        key={key}
                    >
                        <Icon color="var(--interaction-norm)" name={icon} size={4} className="shrink-0" />
                        <div className="text-left flex-1 text-sm">{label}</div>
                    </div>
                ))}
        </Card>
    );
};
