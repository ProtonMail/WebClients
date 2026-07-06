import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';

import type {
    TunableConstantCategory,
    TunableConstantField,
    TunableConstants,
} from '../../../processors/background-processor/tunableConstants';
import { TUNABLE_CONSTANT_FIELDS } from '../../../processors/background-processor/tunableConstants';

import './BlurConstantsPanel.scss';

interface BlurConstantsPanelProps {
    values: TunableConstants;
    defaults: TunableConstants;
    onChange: (key: keyof TunableConstants, value: number) => void;
    onReset: () => void;
    onApply: () => void;
    // True when the edited draft differs from what the preview currently runs.
    isDirty: boolean;
}

const CATEGORY_ORDER: TunableConstantCategory[] = ['Confidence', 'Temporal smoothing', 'Mask shaping', 'Segmentation'];

const formatValue = (field: TunableConstantField, value: number) =>
    field.integer ? String(Math.round(value)) : value.toFixed(2);

export const BlurConstantsPanel = ({
    values,
    defaults,
    onChange,
    onReset,
    onApply,
    isDirty,
}: BlurConstantsPanelProps) => {
    const handleChange = (field: TunableConstantField) => (event: ChangeEvent<HTMLInputElement>) => {
        const parsed = Number(event.target.value);
        if (!Number.isFinite(parsed)) {
            return;
        }
        onChange(field.key, field.integer ? Math.round(parsed) : parsed);
    };

    return (
        <div className="debug-blur-constants bg-weak p-3 flex flex-column gap-3">
            <div className="flex justify-space-between items-center gap-2">
                <h4 className="m-0">{c('Title').t`Constants`}</h4>
                <div className="flex gap-2 items-center">
                    <Button size="small" shape="outline" onClick={onReset}>
                        {c('Action').t`Reset to defaults`}
                    </Button>
                    <Button size="small" shape="solid" color="norm" onClick={onApply} disabled={!isDirty}>
                        {isDirty ? c('Action').t`Apply changes` : c('Action').t`Applied`}
                    </Button>
                </div>
            </div>
            {isDirty && (
                <p className="debug-blur-constants-hint m-0">
                    {c('Info').t`Changes are staged. Apply to rebuild the preview with the new constants.`}
                </p>
            )}

            {CATEGORY_ORDER.map((category) => {
                const fields = TUNABLE_CONSTANT_FIELDS.filter((field) => field.category === category);
                if (fields.length === 0) {
                    return null;
                }

                return (
                    <div key={category} className="flex flex-column gap-2">
                        <div className="debug-blur-constants-group-title text-semibold text-uppercase color-weak pb-1 border-bottom">
                            {category}
                        </div>
                        {fields.map((field) => {
                            const value = values[field.key];
                            const isModified = value !== defaults[field.key];

                            return (
                                <div key={field.key} className="debug-blur-constants-row grid gap-1">
                                    <div className="flex items-center gap-1">
                                        <label
                                            className={clsx(
                                                'debug-blur-constants-label color-norm',
                                                isModified && 'debug-blur-constants-label--modified text-semibold'
                                            )}
                                            htmlFor={`blur-const-${field.key}`}
                                        >
                                            {field.label}
                                            {isModified && ' *'}
                                        </label>
                                        {field.description && (
                                            <Info
                                                className="debug-blur-constants-info"
                                                questionMark
                                                title={field.description}
                                                // The debug overlay sits at z-index 9999; tooltips portal in at
                                                // 1100, so lift this above the overlay or it renders behind it.
                                                tooltipStyle={{ zIndex: 10000 }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min={field.min}
                                            max={field.max}
                                            step={field.step}
                                            value={value}
                                            onChange={handleChange(field)}
                                            className="debug-blur-constants-slider flex-1 min-w-0"
                                        />
                                        <input
                                            id={`blur-const-${field.key}`}
                                            type="number"
                                            min={field.min}
                                            max={field.max}
                                            step={field.step}
                                            value={formatValue(field, value)}
                                            onChange={handleChange(field)}
                                            className="debug-blur-constants-number flex-none"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
