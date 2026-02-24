import { c } from 'ttag';
import { Icon } from '@proton/components';
import clsx from 'clsx';
import type { ToolbarConfig } from './types';

interface ToolbarProps {
    config: ToolbarConfig;
    onColorChange: (color: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onClose: () => void;
    onExport: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const COLORS = [
    { value: '#000000', label: c('Color').t`Black` },
    { value: '#dc3251', label: c('Color').t`Red` },
    { value: '#ff9900', label: c('Color').t`Orange` },
    { value: '#1ea885', label: c('Color').t`Green` },
    { value: '#4D96FF', label: c('Color').t`Blue` },
    { value: '#6d4aff', label: c('Color').t`Purple` },
];

export const Toolbar = ({
    config,
    onColorChange,
    onUndo,
    onRedo,
    onClear,
    onClose,
    onExport,
    canUndo,
    canRedo,
}: ToolbarProps) => {
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-norm rounded-full shadow-lifted border border-weak">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
                {COLORS.map((color) => (
                    <button
                        key={color.value}
                        type="button"
                        className={clsx(
                            'w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110',
                            config.color === color.value && 'scale-110'
                        )}
                        style={{
                            backgroundColor: color.value,
                            border: config.color === color.value
                                ? '10px solid ' + color.value
                                : '10px solid rgba(255, 255, 255, 0.8)',
                            boxShadow: config.color === color.value
                                ? '0 0 0 2px rgba(255, 255, 255, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={() => onColorChange(color.value)}
                        title={color.label}
                        aria-label={color.label}
                    />
                ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-weak" />

            {/* Action Icons */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                        canUndo
                            ? 'hover:bg-weak cursor-pointer'
                            : 'opacity-30 cursor-not-allowed'
                    )}
                    onClick={onUndo}
                    disabled={!canUndo}
                    title={c('Action').t`Undo`}
                    aria-label={c('Action').t`Undo`}
                >
                    <Icon name="arrow-up-and-left-big" size={5} />
                </button>

                <button
                    type="button"
                    className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                        canRedo
                            ? 'hover:bg-weak cursor-pointer'
                            : 'opacity-30 cursor-not-allowed'
                    )}
                    onClick={onRedo}
                    disabled={!canRedo}
                    title={c('Action').t`Redo`}
                    aria-label={c('Action').t`Redo`}
                >
                    <Icon name="arrow-up-and-right-big" size={5} />
                </button>

                <button
                    type="button"
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-weak transition-colors cursor-pointer"
                    onClick={onClear}
                    title={c('Action').t`Clear canvas`}
                    aria-label={c('Action').t`Clear canvas`}
                >
                    <Icon name="trash" size={5} />
                </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-weak" />

            {/* Generate Button */}
            <button
                type="button"
                className="button button-solid-norm button-small px-4 py-2 rounded-full"
                onClick={onExport}
                title={c('Action').t`Generate image`}
                aria-label={c('Action').t`Generate image`}
            >
                {c('Action').t`Done`}
            </button>

            <button
                type="button"
                className="button button-solid-norm button-outline-danger button-small px-4 py-2 rounded-full"
                onClick={onClose}
                title={c('Action').t`Cancel`}
                aria-label={c('Action').t`Cancel`}
            >
                {c('Action').t`Cancel`}
            </button>
        </div>
    );
};
