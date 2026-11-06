import { c } from 'ttag';

import './DotWaveLoader.scss';

/** Three dots bouncing in a wave, shown inline while content is loading. */
export const DotWaveLoader = () => {
    return (
        <output
            className="dot-wave-loader flex gap-1.5 items-end justify-center py-6"
            aria-label={c('Info').t`Loading`}
        >
            <span className="dot-wave-loader-dot rounded-full" aria-hidden="true" />
            <span className="dot-wave-loader-dot rounded-full" aria-hidden="true" />
            <span className="dot-wave-loader-dot rounded-full" aria-hidden="true" />
        </output>
    );
};
