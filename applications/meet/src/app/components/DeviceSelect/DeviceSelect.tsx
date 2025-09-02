import type { RefObject } from 'react';
import React, { useRef } from 'react';

import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import SelectButton from '@proton/components/components/selectTwo/SelectButton';
import { dropdownRootClassName } from '@proton/shared/lib/busy';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { checkForInsideClick } from '../../utils/checkForInsideClick';

import './DeviceSelect.scss';

interface DeviceSelectProps<T extends object> {
    title: string;
    label: string;
    icon: IconName;
    disabled?: boolean;
    isOpen?: boolean;
    setIsOpen: (isOpen: boolean) => void;
    Content?: (props: T & { anchorRef: RefObject<HTMLButtonElement> }) => React.ReactNode;
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
        <div
            className="w-1/2 relative"
            onBlur={(e) => {
                e.stopPropagation();
                e.preventDefault();

                const isInsideDropdown = checkForInsideClick(e, dropdownRootClassName);
                const insideSelect = checkForInsideClick(e, 'device-select');

                if (isOpen && !isInsideDropdown && !insideSelect) {
                    // Safari doesn't properly support relatedTarget on events, added this workaround instead of setting up a global event listener
                    if (isSafari()) {
                        preventReopen.current = true;
                    }

                    setIsOpen(false);
                }
            }}
        >
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
                className="device-select rounded-full py-10 border-norm bg-weak w-full"
            >
                <div className="flex flex-nowrap items-center">
                    <div className="flex items-center h-full mr-4 w-custom" style={{ '--w-custom': '1.75rem' }}>
                        <Icon name={icon} size={6} className="color-weak" />
                    </div>
                    <div className="flex flex-nowrap flex-column">
                        <div className="color-weak text-sm">{title}</div>
                        <div className={clsx('overflow-hidden text-ellipsis', 'selected-label')} title={label}>
                            {label}
                        </div>
                    </div>
                </div>
            </SelectButton>
            {Content && isOpen && <Content anchorRef={anchorRef} {...contentProps} />}
        </div>
    );
};
