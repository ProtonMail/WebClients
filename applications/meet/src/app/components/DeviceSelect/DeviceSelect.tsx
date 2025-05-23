import type { IconName } from '@proton/components';
import { DropdownSizeUnit, Icon, Option, SelectTwo } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './DeviceSelect.scss';

interface DeviceSelectProps {
    title: string;
    value: string;
    onValue: (value: string) => void;
    options: {
        value: string;
        label: string;
    }[];
    icon: IconName;
}

export const DeviceSelect = ({ value, onValue, options, icon, title }: DeviceSelectProps) => {
    return (
        <SelectTwo
            originalPlacement="top"
            offset={16}
            className="device-select w-1/2 rounded-full py-10 border-norm bg-norm"
            value={value}
            onValue={onValue}
            size={{ width: DropdownSizeUnit.Anchor, maxWidth: '331px' }}
            caretIconName="chevron-down"
            availablePlacements={['bottom-end']}
            dropdownClassName="device-select--dropdown"
            renderSelected={(selectedValue) => {
                return (
                    <div className="flex flex-nowrap items-center">
                        <div className="flex items-center h-full mr-4 w-custom" style={{ '--w-custom': '1.75rem' }}>
                            <Icon name={icon} size={7} className="color-weak" viewBox="0 0 24 24" />
                        </div>
                        <div className="flex flex-nowrap flex-column">
                            <div className="color-weak text-sm">{title}</div>
                            <div>{options.find((option) => option.value === selectedValue)?.label}</div>
                        </div>
                    </div>
                );
            }}
        >
            {options.map((option) => (
                <Option
                    key={option.value}
                    value={option.value}
                    title={option.label}
                    className="color-norm device-select__dropdown-item"
                >
                    <div className="flex flex-nowrap items-center">
                        <div className="flex items-center mr-2 w-custom" style={{ '--w-custom': '1.5rem' }}>
                            {option.value === value && <Icon name="checkmark" size={5} className="color-success" />}
                        </div>
                        <div
                            className={clsx(
                                'flex flex-nowrap flex-column bg-transparent',
                                option.value === value ? 'color-norm' : 'color-weak'
                            )}
                        >
                            {option.label}
                        </div>
                    </div>
                </Option>
            ))}
        </SelectTwo>
    );
};
