import type { ComponentType, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

interface Props {
    /** The glyph identifying the action, supplied by the product's tool module. */
    icon: ComponentType<{ className?: string }>;
    title: string;
    /** Optional one-line summary folded under the title (e.g. a destination "→ Archive"). */
    subtitle?: string;
    /** The tool-specific card body (a shared body from `confirmCards/` or a bespoke one). */
    children?: ReactNode;
    /** Freezes the whole card while a confirmed apply runs. */
    disabled?: boolean;
    /** Independently disables just Apply (e.g. the body is in an invalid state). */
    applyDisabled?: boolean;
    applyLabel?: string;
    cancelLabel?: string;
    onApply: () => void;
    onCancel: () => void;
    className?: string;
}

/**
 * The generic chrome shared by every human-in-the-loop confirmation: a header (icon badge + title +
 * optional subtitle), the product-supplied body, and an Apply/Cancel footer. It holds no engine
 * coupling — apply and cancel are plain callbacks — so any product's card renderer mounts its body
 * here and wires the buttons to its own resume (strategy doc §6.5).
 */
const ConfirmCardShell = ({
    icon: Icon,
    title,
    subtitle,
    children,
    disabled,
    applyDisabled,
    applyLabel,
    cancelLabel,
    onApply,
    onCancel,
    className,
}: Props) => (
    <div className={clsx('lumo-confirm-card flex flex-column flex-nowrap gap-3', className)}>
        <div className="flex flex-row flex-nowrap items-center gap-2">
            <span className="lumo-confirm-card__icon shrink-0">
                <Icon />
            </span>
            <div className="lumo-confirm-card__heading flex flex-column flex-nowrap flex-1">
                <span className="text-semibold text-sm text-ellipsis" title={title}>
                    {title}
                </span>
                {subtitle && (
                    <span className="color-weak text-xs text-ellipsis" title={subtitle}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>

        {children}

        <div className="flex flex-row flex-nowrap gap-2">
            <Button className="flex-1" size="small" color="weak" shape="ghost" disabled={disabled} onClick={onCancel}>
                {cancelLabel ?? c('Action').t`Reject`}
            </Button>
            <Button
                className="flex-1"
                size="small"
                color="norm"
                shape="solid"
                disabled={disabled || applyDisabled}
                onClick={onApply}
            >
                {applyLabel ?? c('Action').t`Apply`}
            </Button>
        </div>
    </div>
);

export default ConfirmCardShell;
