import type { FC } from 'react';

import clsx from '@proton/utils/clsx';

import { SpotlightContent } from './SpotlightContent';
import { useSpotlight } from './SpotlightProvider';

import './Spotlight.scss';

export const Spotlight: FC = () => {
    const spotlight = useSpotlight();

    return (
        <div className="flex-auto w-full">
            <div className={clsx('pass-spotlight-panel', !spotlight.state.open && 'pass-spotlight-panel--hidden')}>
                {spotlight.state.message && !spotlight.state.message.hidden && (
                    <SpotlightContent {...spotlight.state.message} />
                )}
            </div>
        </div>
    );
};
