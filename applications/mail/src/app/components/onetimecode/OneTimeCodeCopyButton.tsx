import type { MouseEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import './OneTimeCodeCopyButton.scss';

// Long enough for the copied state to register before onCopy (e.g. a move to Trash) usually removes the button.
const COPIED_STATE_DURATION_MS = 1000;

interface Props {
    code: string;
    /** Displayed in place of {@link code}, e.g. with search highlighting; {@link code} is still what gets copied. */
    codeContent?: ReactNode;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    /** Fired {@link COPIED_STATE_DURATION_MS} after the code has been copied, unless the button unmounts first. */
    onCopy?: () => void;
    /**
     * Whether copying will also move the email to Trash (delete-after-copy pref).
     * Only affects the tooltip wording so the action stays honest about its side
     * effect; the actual move lives in the consumer's {@link onCopy}.
     */
    movesToTrash?: boolean;
    /**
     * Button size, forwarded to the design-system {@link Button}. Defaults to
     * `small` for the compact message-list row; the opened-email toolbar passes
     * `medium` so it matches the height of the Reply/Forward buttons it sits with.
     */
    size?: ButtonLikeSize;
    /** Shrinks the pill to fit a 20px line, such as the column layout's subject line. */
    compact?: boolean;
    className?: string;
}

/**
 * Outline pill displaying a one-time code; copies it to the clipboard on
 * click and shows a "Copied to clipboard" notification. Shared between the
 * opened-email banner and the message-list row.
 */
const OneTimeCodeCopyButton = ({
    code,
    codeContent = code,
    onClick,
    onCopy,
    movesToTrash = false,
    size = 'small',
    compact = false,
    className,
}: Props) => {
    const [isCopied, setIsCopied] = useState(false);
    const onCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { createNotification } = useNotifications();

    // Copying often unmounts this component (the email moves to Trash), so clear
    // the pending onCopy timer to avoid firing it after unmount.
    useEffect(
        () => () => {
            if (onCopyTimerRef.current) {
                clearTimeout(onCopyTimerRef.current);
            }
        },
        []
    );

    const copiedLabel = c('Success').t`Copied '${code}' to clipboard`;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (isCopied) {
            return;
        }
        textToClipboard(code);
        createNotification({ text: copiedLabel });
        setIsCopied(true);
        onCopyTimerRef.current = setTimeout(() => {
            onCopy?.();
            setIsCopied(false);
        }, COPIED_STATE_DURATION_MS);
    };

    const copyLabel = movesToTrash
        ? c('Action').t`Copy '${code}' to clipboard and move to Trash`
        : c('Action').t`Copy '${code}' to clipboard`;
    const tooltipLabel = isCopied ? copiedLabel : copyLabel;

    return (
        <Tooltip title={tooltipLabel}>
            <Button
                size={size}
                pill
                shape="outline"
                color="weak"
                onClick={handleClick}
                className={clsx(
                    'otp-copy-button',
                    compact && 'otp-copy-button--compact',
                    isCopied && 'otp-copy-button--copied',
                    className
                )}
            >
                <span className="inline-flex flex-nowrap items-center">
                    <span className="text-monospace text-semibold">{codeContent}</span>
                    {isCopied ? (
                        <IcCheckmark className="ml-2" alt={tooltipLabel} data-testid="otp-copy-button:copied-icon" />
                    ) : (
                        <IcSquares className="ml-2" alt={tooltipLabel} data-testid="otp-copy-button:copy-icon" />
                    )}
                </span>
            </Button>
        </Tooltip>
    );
};

export default OneTimeCodeCopyButton;
