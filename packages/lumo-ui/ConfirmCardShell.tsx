import type { ComponentType, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import clsx from '@proton/utils/clsx';

interface Props {
    /**
     * What is about to happen, as one natural-language line: "Move 3 emails to Travel". A sentence, not
     * a title, so the card never states an action in one place and its object in another.
     */
    sentence: ReactNode;
    /** A quiet line of scope or consequence beneath the sentence, outside the scrolling body. */
    note?: ReactNode;
    /** The glyph identifying the action, supplied by the product's tool module. */
    icon: ComponentType<{ className?: string }>;
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
 * The generic chrome shared by every human-in-the-loop confirmation: a ruled band (glyph + sentence),
 * the product-supplied body, and a ruled Apply/Cancel footer. It holds no engine coupling — apply and
 * cancel are plain callbacks — so any product's card renderer mounts its body here and wires the
 * buttons to its own resume (strategy doc §6.5).
 */
const ConfirmCardShell = ({
    icon: Icon,
    sentence,
    note,
    children,
    disabled,
    applyDisabled,
    applyLabel,
    cancelLabel,
    onApply,
    onCancel,
    className,
}: Props) => (
    <div className={clsx('lumo-confirm-card flex flex-column flex-nowrap', className)}>
        <div className="lumo-confirm-card__band flex flex-row flex-nowrap items-start gap-2 text-rg">
            <span className="lumo-confirm-card__glyph shrink-0">
                <Icon />
            </span>
            <div className="lumo-confirm-card__sentence flex-1">
                {sentence}
                {note}
            </div>
        </div>

        {children && <Scroll className="lumo-confirm-card__body">{children}</Scroll>}

        <div className="lumo-confirm-card__footer flex flex-row flex-nowrap justify-end gap-2">
            <Button size="small" color="weak" shape="ghost" disabled={disabled} onClick={onCancel}>
                {cancelLabel ?? c('Action').t`Reject`}
            </Button>
            <Button size="small" color="norm" shape="solid" disabled={disabled || applyDisabled} onClick={onApply}>
                {applyLabel ?? c('Action').t`Apply`}
            </Button>
        </div>
    </div>
);

export default ConfirmCardShell;
