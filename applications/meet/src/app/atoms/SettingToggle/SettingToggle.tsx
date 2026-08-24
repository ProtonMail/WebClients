import Toggle from '@proton/components/components/toggle/Toggle';
import clsx from '@proton/utils/clsx';

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
                    labelColor={checked || !changeLabelColor ? 'color-norm' : 'color-hint'}
                    descriptionColor="color-hint"
                />
            </div>
            <div className="shrink-0">
                <ConditionalTooltip title={tooltip}>
                    <Toggle
                        id={id}
                        checked={checked}
                        onChange={onChange}
                        className={clsx('setting-toggle', checked ? '' : 'setting-toggle-inactive')}
                        aria-label={ariaLabel}
                        aria-describedby={description ? `${id}-description` : undefined}
                        disabled={disabled}
                        loading={loading}
                    />
                </ConditionalTooltip>
            </div>
        </div>
    );
};
