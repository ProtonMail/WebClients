import type { RefObject } from 'react';
import React, { useRef } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import SelectButton from '@proton/components/components/selectTwo/SelectButton';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import './DeviceSelect.scss';

interface DeviceSelectProps<T extends object> {
    title: string;
    label: string;
    icon: IconName;
    disabled?: boolean;
    isOpen?: boolean;
    setIsOpen: (isOpen: boolean) => void;
    Content?: (props: T & { anchorRef: RefObject<HTMLButtonElement>; onClose: () => void }) => React.ReactNode;
    contentProps: T;
}

export const DeviceSelect = <T extends object>({
    label,
    icon,
    title,
    disabled,
    isOpen,
    setIsOpen,
    Content,
    contentProps,
}: DeviceSelectProps<T>) => {
    const anchorRef = useRef<HTMLButtonElement>(null);

    const preventReopen = useRef(false);

    return (
        <div className="w-1/2 relative">
            <SelectButton
                unstyled={false}
                isOpen={isOpen}
                onClick={() => {
                    if (preventReopen.current) {
                        preventReopen.current = false;
                        return;
                    }
                    setIsOpen(!isOpen);
                }}
                caretIconName="chevron-down"
                caretClassName="color-weak mr-4 caret-icon"
                ref={anchorRef}
                disabled={disabled}
                className="device-select tertiary rounded-full py-10 border-norm w-full"
            >
                <div className="flex flex-nowrap items-center">
                    <div className="flex items-center h-full mr-3 w-custom shrink-0" style={{ '--w-custom': '1.5rem' }}>
                        <Icon name={icon} size={5} className="color-weak" />
                    </div>
                    <div className="flex flex-nowrap flex-column">
                        <div className="color-weak text-sm">{title}</div>
                        <div className={clsx('overflow-hidden text-ellipsis', 'selected-label')} title={label}>
                            {label}
                        </div>
                    </div>
                </div>
            </SelectButton>
            {Content && isOpen && <Content anchorRef={anchorRef} onClose={() => setIsOpen(false)} {...contentProps} />}
        </div>
    );
};
