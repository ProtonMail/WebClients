import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

import type { ImageAspectRatio } from '../../types';
import { MenuDropdown, MenuItem } from './components/MenuDropdown';

interface RatioOption {
    ratio: ImageAspectRatio;
    getLabel: () => string;
    IconComponent: React.ComponentType;
}

const ICON_CELL = 16;

const makeRatioIcon = (svgWidth: number, svgHeight: number): React.ComponentType => {
    const x = (ICON_CELL - svgWidth) / 2;
    const y = (ICON_CELL - svgHeight) / 2;
    function RatioIcon() {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={ICON_CELL}
                height={ICON_CELL}
                viewBox={`0 0 ${ICON_CELL} ${ICON_CELL}`}
                aria-hidden="true"
            >
                <rect x={x} y={y} width={svgWidth} height={svgHeight} rx="1.5" fill="currentColor" />
            </svg>
        );
    }
    return RatioIcon;
};

const RATIO_OPTIONS: RatioOption[] = [
    { ratio: '1:1', getLabel: () => c('collider_2025:Label').t`1:1`, IconComponent: makeRatioIcon(11, 11) },
    { ratio: '2:3', getLabel: () => c('collider_2025:Label').t`2:3`, IconComponent: makeRatioIcon(8, 12) },
    { ratio: '3:2', getLabel: () => c('collider_2025:Label').t`3:2`, IconComponent: makeRatioIcon(12, 8) },
    { ratio: '9:16', getLabel: () => c('collider_2025:Label').t`9:16`, IconComponent: makeRatioIcon(6, 13) },
    { ratio: '16:9', getLabel: () => c('collider_2025:Label').t`16:9`, IconComponent: makeRatioIcon(13, 6) },
];

interface AspectRatioDropdownProps {
    selectedRatio: ImageAspectRatio;
    onSelect: (ratio: ImageAspectRatio) => void;
}

const AspectRatioDropdown = ({ selectedRatio, onSelect }: AspectRatioDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const currentOption = RATIO_OPTIONS.find((o) => o.ratio === selectedRatio) ?? RATIO_OPTIONS[0];
    const { IconComponent: CurrentIcon } = currentOption;

    return (
        <>
            <Button
                ref={anchorRef}
                shape="ghost"
                size="small"
                className={clsx(
                    'border-0 shrink-0 flex flex-row flex-nowrap gap-1.5 items-center color-norm py-1 px-2 rounded-full text-sm',
                    isOpen && 'is-active'
                )}
                onClick={() => {
                    setIsOpen((prev) => !prev);
                }}
            >
                <CurrentIcon />
                <span className="font-medium">{currentOption.getLabel()}</span>
                <IcChevronDown size={3} className="color-weak" />
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    setIsOpen(false);
                }}
                placement="top-end"
                width="10rem"
            >
                {RATIO_OPTIONS.map((option) => (
                    <MenuItem
                        key={option.ratio}
                        iconSvg={option.IconComponent}
                        getLabel={option.getLabel}
                        onClick={() => {
                            onSelect(option.ratio);
                        }}
                        onClose={() => {
                            setIsOpen(false);
                        }}
                        rightElement={
                            <span
                                className={clsx(
                                    'flex items-center shrink-0',
                                    selectedRatio !== option.ratio && 'visibility-hidden'
                                )}
                            >
                                <IcCheckmark size={4} className="color-primary" />
                            </span>
                        }
                    />
                ))}
            </MenuDropdown>
        </>
    );
};

export default AspectRatioDropdown;
