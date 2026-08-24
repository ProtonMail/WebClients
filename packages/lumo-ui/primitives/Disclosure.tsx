import type { ReactNode } from 'react';

import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import clsx from '@proton/utils/clsx';

interface Props {
    /** The always-visible trigger text. */
    label: string;
    /** Optional glyphs shown before the label; each caller sizes its own. */
    leading?: ReactNode;
    /** Revealed in normal flow beneath the trigger when expanded. */
    children: ReactNode;
    className?: string;
}

/**
 * A compact expandable row: a one-line trigger (optional leading glyphs + label + chevron) whose payload
 * is revealed in-flow below it. Everything in the trigger stays on the trigger's line when the payload
 * opens. It can only grow the column height, never overlay or widen its host; the native `<details>`
 * marker is stripped in SCSS.
 */
const Disclosure = ({ label, leading, children, className }: Props) => (
    <details className={clsx('lumo-disclosure', className)}>
        <summary className="lumo-disclosure__summary text-sm">
            {leading}
            <span className="lumo-disclosure__label text-ellipsis flex-1" title={label}>
                {label}
            </span>
            <IcChevronDown className="lumo-disclosure__chevron shrink-0" size={3} />
        </summary>
        {children}
    </details>
);

export default Disclosure;
