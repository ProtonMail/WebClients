import type { ComponentType, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import clsx from '@proton/utils/clsx';

/**
 * The band states what is about to happen, either as one natural-language line or as a title with an
 * optional summary beneath it. Exactly one of the two, so a card can never render a bandless glyph.
 */
type HeadingProps =
    | { sentence: ReactNode; title?: never; subtitle?: never }
    | {
          sentence?: never;
          title: string;
          /** A one-line summary folded under the title (e.g. a destination "→ Archive"). */
          subtitle?: string;
      };

interface BaseProps {
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

type Props = BaseProps & HeadingProps;

/**
 * The generic chrome shared by every human-in-the-loop confirmation: a ruled band (glyph + either a
 * sentence or a title/subtitle), the product-supplied body, and a ruled Apply/Cancel footer. It holds
 * no engine coupling — apply and cancel are plain callbacks — so any product's card renderer mounts
 * its body here and wires the buttons to its own resume (strategy doc §6.5).
 */
const ConfirmCardShell = ({
    icon: Icon,
    sentence,
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
    <div className={clsx('lumo-confirm-card flex flex-column flex-nowrap', className)}>
        <div className="lumo-confirm-card__band flex flex-row flex-nowrap items-start gap-2">
            <span className="lumo-confirm-card__glyph shrink-0">
                <Icon />
            </span>
            {sentence !== undefined ? (
                <div className="lumo-confirm-card__sentence flex-1 text-sm">{sentence}</div>
            ) : (
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
            )}
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
