import { useCallback, useState } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import { copyDomToClipboard, isFirefox } from '@proton/shared/lib/helpers/browser';

interface Props extends Omit<ButtonProps, 'value'> {
    containerRef: React.MutableRefObject<HTMLDivElement | null>;
    onSuccess?: () => void;
}

const copyToClipboard = async (element: HTMLDivElement): Promise<boolean> => {
    try {
        // Firefox has issues with document.execCommand('copy') and DOM ranges
        // Try modern Clipboard API first for both HTML and text
        if (isFirefox() && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
            try {
                const plainText = element.textContent || element.innerText || '';
                const htmlContent = element.innerHTML;

                // Try to copy both HTML and text using modern API
                const clipboardItems = [
                    new ClipboardItem({
                        'text/plain': new Blob([plainText], { type: 'text/plain' }),
                        'text/html': new Blob([htmlContent], { type: 'text/html' }),
                    }),
                ];

                await navigator.clipboard.write(clipboardItems);
                return true;
            } catch (err) {
                console.warn('Failed to copy with modern Clipboard API for Firefox, falling back to text only', err);
                // Fall back to plain text only
                try {
                    const plainText = element.textContent || element.innerText || '';
                    await navigator.clipboard.writeText(plainText);
                    return true;
                } catch (textErr) {
                    console.warn('Failed to copy as plain text for Firefox, falling back to DOM copy', textErr);
                }
            }
        }

        // Fallback for other browsers or if Firefox Clipboard API fails
        await copyDomToClipboard(element);
        return true;
    } catch (err) {
        console.error('Failed to copy content to clipboard', err);
        return false;
    }
};

const LumoCopyButton = ({ children, onSuccess, containerRef, ...rest }: Props) => {
    const [isCopying, setIsCopying] = useState(false);

    const prepareElementForCopy = useCallback((element: HTMLDivElement): HTMLDivElement => {
        const clonedElement = element.cloneNode(true) as HTMLDivElement;

        // Remove elements that shouldn't be copied
        clonedElement.querySelectorAll('.lumo-no-copy').forEach((btn) => btn.remove());

        // Apply light theme styles for copying to other editors while preserving syntax highlighting
        clonedElement.style.backgroundColor = 'white';
        clonedElement.style.color = 'black';

        const applyLightTheme = (element: HTMLElement) => {
            if (element.tagName === 'CODE' || element.tagName === 'PRE') {
                return;
            }

            element.style.backgroundColor = 'white';
            element.style.color = 'black';

            Array.from(element.children).forEach((child) => {
                if (child instanceof HTMLElement) {
                    applyLightTheme(child);
                }
            });
        };

        applyLightTheme(clonedElement);
        return clonedElement;
    }, []);

    const handleClick = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();

            const element = containerRef.current;
            if (!element) return;

            setIsCopying(true);
            try {
                const clonedElement = prepareElementForCopy(element);
                const success = await copyToClipboard(clonedElement);

                if (success) {
                    onSuccess?.();
                }
            } finally {
                setIsCopying(false);
            }
        },
        [containerRef, onSuccess, prepareElementForCopy]
    );

    const copyLabel = c('Label').t`Copy`;

    return (
        <Tooltip title={copyLabel}>
            <Button
                icon
                color="weak"
                shape={'ghost'}
                size={'small'}
                loading={isCopying}
                aria-label={copyLabel}
                {...rest}
                onClick={handleClick}
            >
                <Icon name="squares" />
            </Button>
        </Tooltip>
    );
};

export default LumoCopyButton;
