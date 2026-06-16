import type { MouseEvent } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcKey } from '@proton/icons/icons/IcKey';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import './OneTimeCodeCopyButton.scss';

// Let the "Copied" toast register first, then fire onCopy so its side effect
// (e.g. the move-to-Trash Undo toast) reads as a natural follow-on, not a clash.
const ON_COPY_DELAY_MS = 200;

interface Props {
    code: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    /**
     * Fired shortly after the code has been copied (see {@link ON_COPY_DELAY_MS}),
     * so any side effect (e.g. a follow-up toast) lands just after the "Copied"
     * notification rather than on top of it.
     */
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
    className?: string;
}

/**
 * Outline button displaying a one-time code; copies it to the clipboard on
 * click and shows a "Copied to clipboard" notification. Shared between the
 * opened-email banner and the message-list row.
 */
const OneTimeCodeCopyButton = ({ code, onClick, onCopy, movesToTrash = false, size = 'small', className }: Props) => {
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

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        textToClipboard(code);
        createNotification({ text: c('Success').t`Copied '${code}' to clipboard` });
        if (onCopy) {
            onCopyTimerRef.current = setTimeout(onCopy, ON_COPY_DELAY_MS);
        }
    };

    const tooltipLabel = movesToTrash
        ? c('Action').t`Copy '${code}' to clipboard and move to Trash`
        : c('Action').t`Copy '${code}' to clipboard`;

    return (
        <Tooltip title={tooltipLabel}>
            <Button
                size={size}
                shape="outline"
                color="norm"
                onClick={handleClick}
                className={clsx('otp-copy-button inline-flex flex-nowrap flex-row items-center pl-2', className)}
            >
                <IcKey className="otp-key-icon mr-2 color-primary" alt={tooltipLabel} />
                <span className="text-monospace text-semibold">{code}</span>
            </Button>
        </Tooltip>
    );
};

export default OneTimeCodeCopyButton;
