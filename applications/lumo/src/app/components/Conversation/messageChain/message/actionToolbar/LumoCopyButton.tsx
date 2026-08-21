import React, { useCallback, useState } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { copyDomToClipboard } from '@proton/shared/lib/helpers/browser';

import { LumoIcon } from '../../../../LumoIcon/LumoIcon.tsx';

interface Props extends Omit<ButtonProps, 'value'> {
    /** Plain-text clipboard payload (e.g. markdown source). Used alone or with containerRef. */
    textToCopy?: string;
    /** Rendered DOM for rich HTML clipboard payload (e.g. Google Docs paste). */
    containerRef?: React.MutableRefObject<HTMLDivElement | null>;
    onSuccess?: () => void;
}

const copyRichHtmlToClipboard = async (element: HTMLDivElement, plainText?: string): Promise<boolean> => {
    if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function') {
        return false;
    }

    const plainTextPayload = plainText ?? element.textContent ?? element.innerText ?? '';
    const htmlContent = element.innerHTML;

    const blobs = {
        'text/plain': new Blob([plainTextPayload], { type: 'text/plain' }),
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
    };
    try {
        await navigator.clipboard.write([new ClipboardItem(blobs)]);
        return true;
    } catch (err) {
        console.warn('Failed to copy with Clipboard API, falling back to DOM copy', err);
        return false;
    }
};

const copyToClipboard = async (element: HTMLDivElement, plainText?: string): Promise<boolean> => {
    try {
        // Prefer Clipboard API (HTML + plain) when available — execCommand('copy') is unreliable in
        // Firefox and can omit text/html in some browsers, which pastes as plain text only.
        if (await copyRichHtmlToClipboard(element, plainText)) {
            return true;
        }

        if (plainText !== undefined && (await copyPlainText(plainText))) {
            return true;
        }

        await copyDomToClipboard(element);
        return true;
    } catch (err) {
        console.error('Failed to copy content to clipboard', err);
        return false;
    }
};

const copyPlainText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text to clipboard', err);
        return false;
    }
};

const LumoCopyButton = ({ children, onSuccess, containerRef, textToCopy, ...rest }: Props) => {
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

            setIsCopying(true);
            try {
                let success = false;

                const element = containerRef?.current;

                if (textToCopy !== undefined && !element) {
                    success = await copyPlainText(textToCopy);
                } else if (textToCopy !== undefined && element) {
                    const clonedElement = prepareElementForCopy(element);
                    success = await copyToClipboard(clonedElement, textToCopy);
                } else if (element) {
                    const clonedElement = prepareElementForCopy(element);
                    success = await copyToClipboard(clonedElement);
                }

                if (success) {
                    onSuccess?.();
                }
            } finally {
                setIsCopying(false);
            }
        },
        [containerRef, onSuccess, prepareElementForCopy, textToCopy]
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
                <LumoIcon name="Copy" size={16} />
            </Button>
        </Tooltip>
    );
};

export default LumoCopyButton;
