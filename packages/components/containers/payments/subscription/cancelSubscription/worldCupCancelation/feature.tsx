import type { ReactNode } from 'react';

import { c } from 'ttag';

import { IcBolt } from '@proton/icons/icons/IcBolt';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import { IcMobile } from '@proton/icons/icons/IcMobile';

export type Feature = { value: () => string; icon: ReactNode };
export const features: Feature[] = [
    { value: () => c('Info').t`Fastest VPN speeds of up to 10Gbps`, icon: <IcBolt /> },
    {
        value: () => c('Info').t`Access to 20,000+ servers in 145 countries`,
        icon: <IcEarth />,
    },
    {
        value: () => c('Info').t`Premium privacy protection across all your devices`,
        icon: <IcMobile />,
    },
];
