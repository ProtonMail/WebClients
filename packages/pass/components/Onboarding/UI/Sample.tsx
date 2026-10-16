import type { FC } from 'react';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import clsx from '@proton/utils/clsx';

import type { MaybeNull } from '../../../types';
import { ItemIcon } from '../../Layout/Icon/ItemIcon';
import star from './star.png';

import './Sample.scss';

type Props = {
    single?: boolean;
    service: string;
    userIdentifier: string;
    url?: MaybeNull<string>;
};

export const Sample: FC<Props> = ({ single = false, service, userIdentifier, url }) => {
    return (
        <div className={clsx('pass-onboarding-sample pt-8 relative', single && 'single')}>
            <div className="border"></div>
            <div className="border"></div>
            <div className="border flex flex-row items-center justify-start px-6 py-4 gap-4">
                <ItemIcon alt="" icon={IcGlobe} url={url} size={8} loadImage />
                <div className="flex flex-column">
                    <h3>{service}</h3>
                    <h4 className="color-weak">{userIdentifier}</h4>
                </div>
            </div>
            <img src={star} alt="" />
            <img src={star} alt="" />
        </div>
    );
};
