import { clsx } from 'clsx';

import { useCopyNotification } from '../../../hooks/useCopyNotification';
import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import LumoCopyButton from '../messageChain/message/actionToolbar/LumoCopyButton';

interface Props {
    code: string;
    /** Positioning only; the caller decides where the control sits (corner, sticky row, ...). */
    className?: string;
}
/**
 * Per-block copy control, as on chat code blocks: revealed on hover (always shown on small screens).
 * Copies `code` as plain text, so the clipboard gets the block's source rather than the rendered DOM.
 * Render it inside a `group-hover-opacity-container` so hovering the block reveals it.
 */
export const ArtifactCodeCopyButton = ({ code, className }: Props) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { showCopyNotification } = useCopyNotification();

    return (
        <div
            className={clsx(
                'z-1 bg-norm rounded shadow-lifted',
                !isSmallScreen && 'group-hover:opacity-100',
                className
            )}
        >
            <LumoCopyButton textToCopy={code} onSuccess={showCopyNotification} />
        </div>
    );
};
