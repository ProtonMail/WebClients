import React, { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import type { RetryStrategy } from '../types';
import { isImeComposing } from '../util/keyboard';
import { type IconName, LumoIcon } from './LumoIcon/LumoIcon';

type RetryOption = {
    strategy: RetryStrategy;
    label: string;
    icon: IconName;
    description: string;
};

const getRetryOptions = (): RetryOption[] => [
    {
        strategy: 'try_again',
        label: c('collider_2025:Action').t`Try again`,
        icon: 'RotateCcw',
        description: c('collider_2025:Action').t`Retry with the same prompt`,
    },
    {
        strategy: 'add_details',
        label: c('collider_2025:Action').t`Add details`,
        icon: 'List',
        description: c('collider_2025:Action').t`Add more information to improve the response`,
    },
    {
        strategy: 'more_concise',
        label: c('collider_2025:Action').t`More concise`,
        icon: 'TextAlignStart',
        description: c('collider_2025:Action').t`Request a shorter, more focused response`,
    },
    {
        strategy: 'think_longer',
        label: c('collider_2025:Action').t`Think longer`,
        icon: 'Clock',
        description: c('collider_2025:Action').t`Ask the model to be more careful and thorough`,
    },
];

interface RetryPanelProps {
    onRetry: (strategy: RetryStrategy, customInstructions?: string) => void;
    disabled?: boolean;
    className?: string;
}

export const RetryPanel: React.FC<RetryPanelProps> = ({ onRetry, disabled = false, className }) => {
    const [customInstructions, setCustomInstructions] = useState('');

    const handleOptionClick = (strategy: RetryStrategy) => {
        // Pass custom instructions if they exist, otherwise just the strategy
        onRetry(strategy, customInstructions.trim() || undefined);
        setCustomInstructions(''); // Clear the input after any retry
    };

    const handleCustomRetry = () => {
        if (customInstructions.trim()) {
            onRetry('custom', customInstructions.trim());
            setCustomInstructions('');
        }
    };

    return (
        <div className={clsx('flex flex-col gap-3 p-4', className)}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="lumo-body-small lumo-color-glyph-mid">
                    {c('collider_2025:Action').t`Describe desired changes...`}
                </span>
            </div>

            {/* Custom instructions with circular submit button - AT THE TOP */}
            <div className="relative" style={{ position: 'relative', width: '100%' }}>
                <input
                    type="text"
                    value={customInstructions}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomInstructions(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        // Ignore Enter while an IME composition is in progress.
                        if (isImeComposing(e)) {
                            return;
                        }
                        if (e.key === 'Enter' && customInstructions.trim()) {
                            e.preventDefault();
                            handleCustomRetry();
                        }
                    }}
                    placeholder={c('collider_2025:Action').t`What needs changed?`}
                    className="focus:border-primary focus:outline-none border lumo-border radius-full lumo-body-small lumo-bg-panel transition-colors"
                    disabled={disabled}
                    style={{
                        display: 'block',
                        width: '100%',
                        paddingLeft: '16px',
                        paddingRight: '40px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        margin: 0,
                        boxSizing: 'border-box',
                    }}
                />
                <button
                    onClick={handleCustomRetry}
                    disabled={disabled || !customInstructions.trim()}
                    className={`radius-full flex items-center justify-center transition-all lumo-easing-standard duration-200 ${
                        customInstructions.trim()
                            ? 'lumo-bg-control-brand-fill lumo-elevation-1'
                            : 'lumo-bg-control-fill cursor-not-allowed'
                    }`}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '28px',
                        height: '28px',
                        zIndex: 10,
                    }}
                >
                    <LumoIcon
                        name="ArrowRight"
                        width={12}
                        height={12}
                        className={
                            customInstructions.trim() ? 'lumo-color-control-brand-text' : 'lumo-color-glyph-disabled'
                        }
                    />
                </button>
            </div>

            {/* Quick retry options in 2x2 grid - AT THE BOTTOM */}
            <div className="grid grid-cols-2 gap-2">
                {getRetryOptions().map((option) => (
                    <button
                        key={option.strategy}
                        className="hover:bg-weak flex items-center gap-2 px-3 py-2 radius-8 text-left transition-colors"
                        onClick={() => handleOptionClick(option.strategy)}
                        disabled={disabled}
                        title={option.description}
                    >
                        <LumoIcon name={option.icon} className="shrink-0" />
                        <span className="lumo-body-small">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
