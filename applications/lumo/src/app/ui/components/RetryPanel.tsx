import React, { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons/types';

import type { RetryStrategy } from '../../types';

export type RetryOption = {
    strategy: RetryStrategy;
    label: string;
    icon: IconName;
    description: string;
};

const RETRY_OPTIONS: RetryOption[] = [
    {
        strategy: 'try_again',
        label: c('collider_2025:Action').t`Try again`,
        icon: 'arrows-rotate',
        description: c('collider_2025:Action').t`Retry with the same prompt`,
    },
    {
        strategy: 'add_details',
        label: c('collider_2025:Action').t`Add details`,
        icon: 'list-bullets',
        description: c('collider_2025:Action').t`Add more information to improve the response`,
    },
    {
        strategy: 'more_concise',
        label: c('collider_2025:Action').t`More concise`,
        icon: 'text-align-left',
        description: c('collider_2025:Action').t`Request a shorter, more focused response`,
    },
    {
        strategy: 'think_longer',
        label: c('collider_2025:Action').t`Think longer`,
        icon: 'clock',
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
                <span className="text-sm font-medium text-grey">
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
                        if (e.key === 'Enter' && customInstructions.trim()) {
                            e.preventDefault();
                            handleCustomRetry();
                        }
                    }}
                    placeholder={c('collider_2025:Action').t`What needs changed?`}
                    className="text-sm border border-weak rounded-full focus:border-primary focus:outline-none bg-norm transition-colors"
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
                    className={`rounded-full flex items-center justify-center transition-all duration-200 ${
                        customInstructions.trim()
                            ? 'bg-primary hover:bg-primary-dark shadow-sm'
                            : 'bg-weak cursor-not-allowed'
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
                    <Icon
                        name="arrow-right"
                        size={3}
                        className={customInstructions.trim() ? 'text-white' : 'text-hint'}
                    />
                </button>
            </div>

            {/* Quick retry options in 2x2 grid - AT THE BOTTOM */}
            <div className="grid grid-cols-2 gap-2">
                {RETRY_OPTIONS.map((option) => (
                    <button
                        key={option.strategy}
                        className="flex items-center gap-2 px-3 py-2 text-left hover:bg-weak rounded-md transition-colors"
                        onClick={() => handleOptionClick(option.strategy)}
                        disabled={disabled}
                        title={option.description}
                    >
                        <Icon name={option.icon} className="shrink-0" />
                        <span className="text-sm">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RetryPanel;
