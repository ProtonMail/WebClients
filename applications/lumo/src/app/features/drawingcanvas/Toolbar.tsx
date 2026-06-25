import { useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUpAndLeftBig } from '@proton/icons/icons/IcArrowUpAndLeftBig';
import { IcArrowUpAndRightBig } from '@proton/icons/icons/IcArrowUpAndRightBig';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import type { ToolbarConfig } from './types';

interface ToolbarProps {
    config: ToolbarConfig;
    onColorChange: (color: string) => void;
    onStrokeWidthChange: (width: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onClose: () => void;
    onExport: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const MODAL_COLORS = [
    { value: '#ffffff', label: c('Color').t`White`, bordered: true },
    { value: '#000000', label: c('Color').t`Black` },
    { value: '#f4a8b8', label: c('Color').t`Pink` },
    { value: '#ffab91', label: c('Color').t`Orange` },
    { value: '#ffe082', label: c('Color').t`Yellow` },
    { value: '#90caf9', label: c('Color').t`Blue` },
];

const STROKE_WIDTHS = [
    { value: 2, label: c('collider_2025:Label').t`Fine` },
    { value: 4, label: c('collider_2025:Label').t`Medium` },
    { value: 8, label: c('collider_2025:Label').t`Thick` },
];

const TOOL_BUTTON_CLASS =
    'sketch-toolbar__tool inline-flex items-center justify-center rounded-lg bg-transparent color-norm border-none';

export const Toolbar = ({
    config,
    onColorChange,
    onStrokeWidthChange,
    onUndo,
    onRedo,
    onClear,
    onClose,
    onExport,
    canUndo,
    canRedo,
}: ToolbarProps) => {
    const [showStrokeMenu, setShowStrokeMenu] = useState(false);
    const strokeMenuRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!showStrokeMenu) return;
        const handler = (e: MouseEvent) => {
            if (strokeMenuRef.current && !strokeMenuRef.current.contains(e.target as Node)) {
                setShowStrokeMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showStrokeMenu]);

    return (
        <div className="sketch-toolbar sketch-toolbar--modal w-full flex flex-column items-stretch gap-3 pt-3 md:flex-row md:flex-wrap md:items-center md:gap-2">
            <div className="sketch-toolbar__primary flex flex-wrap items-center gap-2 gap-y-2 min-w-0 flex-1 md:flex-nowrap md:gap-y-0">
                <span ref={strokeMenuRef} className="sketch-toolbar__pen-menu relative shrink-0 inline-block">
                    <button
                        type="button"
                        className={clsx(
                            TOOL_BUTTON_CLASS,
                            (showStrokeMenu || config.tool === 'pen') && 'bg-weak'
                        )}
                        title={c('Action').t`Pen thickness`}
                        aria-label={c('Action').t`Pen thickness`}
                        aria-expanded={showStrokeMenu}
                        onClick={() => setShowStrokeMenu((v) => !v)}
                    >
                        <IcPen size={4} />
                    </button>
                    {showStrokeMenu && (
                        <span className="sketch-toolbar__stroke-popup absolute inline-flex flex-column gap-0.5 p-1 rounded-xl border bg-norm shadow-lifted">
                            {STROKE_WIDTHS.map((stroke) => (
                                <button
                                    key={stroke.value}
                                    type="button"
                                    className={clsx(
                                        'sketch-toolbar__stroke-item flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-semibold text-left border-none bg-transparent color-norm',
                                        config.strokeWidth === stroke.value && 'bg-weak'
                                    )}
                                    onClick={() => {
                                        onStrokeWidthChange(stroke.value);
                                        setShowStrokeMenu(false);
                                    }}
                                >
                                    <span
                                        className="sketch-toolbar__stroke-preview shrink-0 rounded-full"
                                        style={{
                                            inlineSize: stroke.value * 2,
                                            blockSize: stroke.value * 2,
                                            backgroundColor: 'var(--text-norm)',
                                        }}
                                    />
                                    {stroke.label}
                                </button>
                            ))}
                        </span>
                    )}
                </span>

                <div className="sketch-toolbar__colors flex items-center gap-1.5 shrink-0 overflow-x-auto flex-nowrap px-1 order-2 w-full pb-0.5 md:order-initial md:w-auto md:pb-0">
                    {MODAL_COLORS.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            className={clsx(
                                'sketch-toolbar__color shrink-0',
                                color.bordered && 'border',
                                config.color === color.value && 'sketch-toolbar__color--selected'
                            )}
                            style={{ backgroundColor: color.value }}
                            onClick={() => onColorChange(color.value)}
                            title={color.label}
                            aria-label={color.label}
                        />
                    ))}
                </div>

                <div className="sketch-toolbar__history flex items-center gap-1 shrink-0 ml-auto md:ml-0">
                    <button
                        type="button"
                        className={clsx(TOOL_BUTTON_CLASS, !canUndo && 'opacity-30 cursor-not-allowed')}
                        onClick={onUndo}
                        disabled={!canUndo}
                        title={c('Action').t`Undo`}
                        aria-label={c('Action').t`Undo`}
                    >
                        <IcArrowUpAndLeftBig size={4} />
                    </button>

                    <button
                        type="button"
                        className={clsx(TOOL_BUTTON_CLASS, !canRedo && 'opacity-30 cursor-not-allowed')}
                        onClick={onRedo}
                        disabled={!canRedo}
                        title={c('Action').t`Redo`}
                        aria-label={c('Action').t`Redo`}
                    >
                        <IcArrowUpAndRightBig size={4} />
                    </button>

                    <button
                        type="button"
                        className={TOOL_BUTTON_CLASS}
                        onClick={onClear}
                        title={c('Action').t`Clear canvas`}
                        aria-label={c('Action').t`Clear canvas`}
                    >
                        <IcTrash size={4} />
                    </button>
                </div>
            </div>

            <div className="sketch-toolbar__actions flex items-center gap-2 w-full ml-0 md:w-auto md:ml-auto md:shrink-0">
                <Button shape="outline" size="medium" className="flex-1 md:flex-initial" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button shape="solid" color="norm" size="medium" className="flex-1 md:flex-initial" onClick={onExport}>
                    {c('Action').t`Done`}
                </Button>
            </div>
        </div>
    );
};
