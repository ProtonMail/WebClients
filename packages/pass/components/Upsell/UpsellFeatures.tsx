import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import type { IconComponent } from '@proton/icons/component';
import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcFile } from '@proton/icons/icons/IcFile';
import { IcFolder } from '@proton/icons/icons/IcFolder';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcListBullets } from '@proton/icons/icons/IcListBullets';
import { IcPassCircles } from '@proton/icons/icons/IcPassCircles';
import { IcUsersPlus } from '@proton/icons/icons/IcUsersPlus';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PASS_SENTINEL_LINK } from '../../constants';
import type { UpsellType } from './UpsellingModal';

type Props = { upsellType: UpsellType };
type UpsellFeature = { key: UpsellFeatureName; className: string; icon: IconComponent; label: string | string[] };

type UpsellFeatureName = 'aliases' | '2FA' | 'logins' | 'sentinel' | 'secure-links' | 'file-attachments' | 'folders';

const PROTON_SENTINEL_LINK = (
    <a href={PASS_SENTINEL_LINK} target="_blank" key="sentinel-link">
        {PROTON_SENTINEL_NAME}
    </a>
);

const getFeatures = (): UpsellFeature[] => [
    {
        key: 'aliases',
        className: 'ui-teal',
        icon: IcAlias,
        label: c('Info').t`Unlimited hide-my-email aliases and advanced alias management`,
    },
    {
        key: '2FA',
        className: 'ui-orange',
        icon: IcPassCircles,
        label: c('Info').t`Built in 2FA authenticator`,
    },
    {
        key: 'logins',
        className: 'ui-red',
        icon: IcUsersPlus,
        label: c('Info').t`Share your logins and secure notes, with up to 10 people`,
    },
    {
        key: 'sentinel',
        className: 'ui-lime',
        icon: IcListBullets,
        label:
            // translator: full sentence is Protected by Proton Sentinel, our advanced account protection program
            c('Info').jt`Protected by ${PROTON_SENTINEL_LINK}, our advanced account protection program`,
    },
    {
        key: 'secure-links',
        className: 'ui-violet',
        icon: IcLink,
        label: c('Info').t`Secure links`,
    },
    {
        key: 'file-attachments',
        className: 'ui-gray',
        icon: IcFile,
        label: c('Pass_file_attachments').t`File attachments`,
    },
    {
        key: 'folders',
        className: 'ui-orange',
        icon: IcFolder,
        label: c('Label').t`Folders`,
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
                .map(({ className, icon: Icon, label, key }, idx) => (
                    <div
                        className={clsx(
                            'flex justify-start items-center py-3 gap-3',
                            idx < features.length - 1 && 'border-bottom border-weak',
                            className
                        )}
                        key={key}
                    >
                        <Icon color="var(--interaction-norm)" size={4} className="shrink-0" />
                        <div className="text-left flex-1 text-sm">{label}</div>
                    </div>
                ))}
        </Card>
    );
};
