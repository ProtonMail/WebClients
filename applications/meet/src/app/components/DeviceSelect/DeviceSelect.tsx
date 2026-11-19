import type { RefObject } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import SelectButton from '@proton/components/components/selectTwo/SelectButton';
import type { IconComponent } from '@proton/icons/component';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

import { useIsTextTruncated } from '../PageHeader/useIsTextTruncated';
import { type TooltipEvent, type TooltipState, nextTooltipState } from './nextTooltipState';
import { splitDeviceLabel } from './splitDeviceLabel';

import './DeviceSelect.scss';

interface DeviceSelectProps<T extends object> {
    title: string;
    label: string;
    accessibleLabel: string;
    icon: IconComponent;
    disabled?: boolean;
    isOpen?: boolean;
    setIsOpen: (isOpen: boolean) => void;
    Content?: (props: T & { anchorRef: RefObject<HTMLButtonElement | null>; onClose: () => void }) => React.ReactNode;
    contentProps: T;
}

export const DeviceSelect = <T extends object>({
    label,
    accessibleLabel,
    icon: Icon,
    title,
    disabled,
    isOpen = false,
    setIsOpen,
    Content,
    contentProps,
}: DeviceSelectProps<T>) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [tooltipState, setTooltipState] = useState<TooltipState>('idle');
    const { ref: labelStartRef, isTruncated } = useIsTextTruncated<HTMLSpanElement>();
    const { start, end } = splitDeviceLabel(label);

    // The menu's focus trap gives focus back while the menu unmounts, before this effect sees it closed.
    const menuWasOpenRef = useRef(isOpen);
    useEffect(() => {
        menuWasOpenRef.current = isOpen;
    }, [isOpen]);

    const sendTooltipEvent = (event: TooltipEvent) => setTooltipState(nextTooltipState(event, isOpen));

    return (
        <div
            className="w-1/2 relative"
            // Capture: the menu's Dropdown stops Escape from bubbling.
            onKeyDownCapture={(event) => {
                if (event.key === 'Escape') {
                    sendTooltipEvent('escape');
                }
            }}
        >
            <Tooltip
                title={label}
                isOpen={isTruncated && !isOpen && tooltipState === 'requested'}
                describeChild={false}
                originalPlacement="top"
                closeDelay={0}
                tooltipClassName="meet-tooltip bg-strong color-norm"
                tooltipStyle={{ '--meet-tooltip-bg': 'var(--interaction-norm-minor-2)' }}
            >
                <SelectButton
                    unstyled={false}
                    isOpen={isOpen}
                    onClick={() => {
                        sendTooltipEvent('click');
                        setIsOpen(!isOpen);
                    }}
                    onMouseEnter={() => sendTooltipEvent('mouseEnter')}
                    onMouseLeave={() => sendTooltipEvent('mouseLeave')}
                    onFocus={() => sendTooltipEvent(menuWasOpenRef.current ? 'menuGaveFocusBack' : 'focus')}
                    onBlur={() => sendTooltipEvent('blur')}
                    caretIcon={<IcChevronDown />}
                    caretClassName="color-weak mr-4 caret-icon"
                    ref={anchorRef}
                    disabled={disabled}
                    className="device-select tertiary rounded-full py-10 border-norm w-full"
                    aria-label={accessibleLabel}
                    aria-haspopup="dialog"
                >
                    <div className="flex flex-nowrap items-center" aria-hidden="true">
                        <div
                            className="flex items-center h-full mr-3 w-custom shrink-0"
                            style={{ '--w-custom': '1.5rem' }}
                        >
                            <Icon size={5} className="color-weak" />
                        </div>
                        <div className="flex flex-nowrap flex-column flex-1 min-w-0">
                            <div className="color-weak text-sm">{title}</div>{' '}
                            <span className="flex flex-nowrap">
                                <span ref={labelStartRef} className="text-ellipsis text-pre">
                                    {start}
                                </span>
                                {end && <span className="shrink-0 text-pre">{end}</span>}
                            </span>
                        </div>
                    </div>
                </SelectButton>
            </Tooltip>
            {Content && isOpen && <Content anchorRef={anchorRef} onClose={() => setIsOpen(false)} {...contentProps} />}
        </div>
    );
};
