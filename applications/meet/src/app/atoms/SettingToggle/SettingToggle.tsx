import Toggle from '@proton/components/components/toggle/Toggle';
import clsx from '@proton/utils/clsx';

import { useRestoreFocusAfterLoading } from '../../hooks/useRestoreFocusAfterLoading';
import { ConditionalTooltip } from '../ConditionalTooltip/ConditionalTooltip';
import { LabelAndDescription } from '../LabelAndDescription/LabelAndDescription';

import './SettingToggle.scss';

type Props = {
    id: string;
    label: string;
    description?: string | React.ReactNode;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    checked: boolean;
    ariaLabel: string;
    disabled?: boolean;
    loading?: boolean;
    changeLabelColor?: boolean;
    tooltip?: string;
    className?: string;
};

export const SettingToggle = ({
    id,
    label,
    description,
    onChange,
    checked,
    ariaLabel,
    disabled = false,
    loading = false,
    changeLabelColor = true,
    tooltip,
    className,
}: Props) => {
    const { inputRef, trackFocus } = useRestoreFocusAfterLoading(loading);

    const getLabelColor = () => {
        if (!changeLabelColor) {
            return 'color-norm';
        }
        // Toggles are also disabled while loading, which should not read as unavailable
        if (disabled && !loading) {
            return 'color-disabled';
        }
        return checked ? 'color-norm' : 'color-weak';
    };

    const describedBy = [description ? `${id}-description` : undefined, tooltip ? `${id}-reason` : undefined]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={clsx(
                'flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap shrink-0 items-center',
                className
            )}
        >
            <div className="flex flex-column flex-nowrap gap-1 w-full">
                <LabelAndDescription
                    label={label}
                    description={description}
                    size="medium"
                    id={id}
                    labelColor={getLabelColor()}
                    descriptionColor="color-hint"
                />
            </div>
            <div className="shrink-0">
                <ConditionalTooltip title={tooltip}>
                    <Toggle
                        ref={inputRef}
                        id={id}
                        checked={checked}
                        onChange={(event) => {
                            trackFocus();
                            onChange(event);
                        }}
                        className={clsx('setting-toggle', checked ? '' : 'setting-toggle-inactive')}
                        aria-label={ariaLabel}
                        aria-describedby={describedBy || undefined}
                        disabled={disabled}
                        loading={loading}
                    />
                </ConditionalTooltip>
                {tooltip && (
                    <span id={`${id}-reason`} className="sr-only">
                        {tooltip}
                    </span>
                )}
            </div>
        </div>
    );
};
