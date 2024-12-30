import { type FC, memo } from 'react';

import clsx from '@proton/utils/clsx';

import { SpotlightContent } from './SpotlightContent';
import { useSpotlight } from './SpotlightProvider';

export const Spotlight: FC = memo(() => {
    const spotlight = useSpotlight();

    return (
        <div className="flex-auto w-full">
            <div className={clsx('anime-reveal', !spotlight.state.open && 'anime-reveal--hidden')}>
                {spotlight.state.message && !spotlight.state.message.hidden && (
                    <SpotlightContent {...spotlight.state.message} />
                )}
            </div>
        </div>
    );
});

Spotlight.displayName = 'SpotlightMemo';
