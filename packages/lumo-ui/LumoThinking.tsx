import { c } from 'ttag';

import lumoCatGenerating from '@proton/styles/assets/img/lumo/lumo-cat-generating-response.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    /** Overrides the default "Thinking about this" status text (e.g. to name the product). */
    label?: string;
    className?: string;
}

/**
 * The animated "generating response" cat plus a pulsing status label, shown while the assistant works —
 * that pair alone conveys activity (matching lumo.proton.me), so no separate progress bar is needed.
 * The cat sits in a fixed slot so a host layout never shifts idle → thinking → replied; the SCSS fills
 * the under-sized artwork to the box.
 */
const LumoThinking = ({ label, className }: Props) => {
    const text = label ?? c('Info').t`Thinking about this`;

    return (
        <div className={clsx('lumo-thinking', className)} aria-label={text}>
            <span className="lumo-thinking__cat shrink-0">
                <img src={lumoCatGenerating} alt="" aria-hidden="true" />
            </span>
            <span className="lumo-thinking__text color-weak">{text}</span>
        </div>
    );
};

export default LumoThinking;
