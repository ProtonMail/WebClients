import type { ReactNode } from 'react';

import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import clsx from '@proton/utils/clsx';

import type { IconComponent } from '../types';

interface Props {
    /** The always-visible trigger text. */
    label: string;
    /** Optional leading glyph shown before the label. */
    icon?: IconComponent;
    /** Revealed in normal flow beneath the trigger when expanded. */
    children: ReactNode;
    className?: string;
}

/**
 * A compact expandable row: a one-line trigger (optional icon + label + chevron) whose payload is
 * revealed in-flow below it. It can only grow the column height, never overlay or widen its host.
 * Shared by {@link Chip} and {@link ServerToolChip}; the native `<details>` marker is stripped in SCSS.
 */
const Disclosure = ({ label, icon: Icon, children, className }: Props) => (
    <details className={clsx('lumo-disclosure', className)}>
        <summary className="lumo-disclosure__summary text-sm">
            {Icon && <Icon className="shrink-0" size={3} />}
            <span className="lumo-disclosure__label text-ellipsis flex-1" title={label}>
                {label}
            </span>
            <IcChevronDown className="lumo-disclosure__chevron shrink-0" size={3} />
        </summary>
        {children}
    </details>
);

export default Disclosure;
