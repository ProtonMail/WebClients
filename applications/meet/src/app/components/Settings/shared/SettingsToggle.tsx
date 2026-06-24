import { Toggle } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import { ConditionalTooltip } from '../../ConditionalTooltip/ConditionalTooltip';

type Props = {
    id: string;
    label: string;
    description?: string;
    onChange: () => void;
    checked: boolean;
    ariaLabel: string;
    disabled?: boolean;
    loading?: boolean;
    changeLabelColor?: boolean;
    tooltip?: string;
};

export const SettingsToggle = ({
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
}: Props) => {
    return (
        <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap shrink-0 items-center">
            <div className="flex flex-column flex-nowrap gap-1 w-full">
                <label
                    className={clsx('setting-label', checked || !changeLabelColor ? 'color-norm' : 'color-hint')}
                    htmlFor={id}
                >
                    {label}
                </label>
                {description && <span className="setting-description color-hint">{description}</span>}
            </div>
            <ConditionalTooltip title={tooltip}>
                <Toggle
                    id={id}
                    checked={checked}
                    onChange={onChange}
                    className={clsx('settings-toggle', checked ? '' : 'settings-toggle-inactive')}
                    aria-label={ariaLabel}
                    disabled={disabled}
                    loading={loading}
                />
            </ConditionalTooltip>
        </div>
    );
};
