import { useEffect, useState } from 'react';

import type { RetryStrategy } from '../types';
import { RetryPanel } from './RetryPanel';

interface FloatingRetryPanelProps {
    buttonRef: HTMLElement;
    onRetry: (retryStrategy: RetryStrategy, customInstructions?: string) => void;
    onClose: () => void;
}

export const FloatingRetryPanel = ({ buttonRef, onRetry, onClose }: FloatingRetryPanelProps) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (buttonRef) {
            const rect = buttonRef.getBoundingClientRect();
            const panelWidth = 320;
            const panelHeight = 200;

            let top = rect.top - panelHeight - 8;
            let left = rect.left + rect.width / 2 - panelWidth / 2;

            if (top < 0) {
                top = rect.bottom + 8;
            }
            if (left < 8) {
                left = 8;
            } else if (left + panelWidth > window.innerWidth - 8) {
                left = window.innerWidth - panelWidth - 8;
            }

            setPosition({ top, left });
        }
    }, [buttonRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (buttonRef && !buttonRef.contains(target)) {
                const panel = document.querySelector('.floating-retry-panel');
                if (panel && !panel.contains(target)) {
                    onClose();
                }
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [buttonRef, onClose]);

    if (!position) {
        return null;
    }

    return (
        <div
            className="floating-retry-panel fixed z-50 bg-norm border border-weak rounded-xl shadow-lifted"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: '320px',
                opacity: 1,
                transition: 'opacity 150ms ease-in-out',
            }}
        >
            <RetryPanel onRetry={onRetry} className="border-none shadow-none" />
        </div>
    );
};
