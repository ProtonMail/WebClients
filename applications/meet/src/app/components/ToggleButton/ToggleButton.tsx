import type { RefObject } from 'react';
import { useRef } from 'react';

import { Button, Tooltip } from '@proton/atoms';
import type { IconProps } from '@proton/components/components/icon/Icon';
import type { PopperPosition } from '@proton/components/components/popper/interface';
import { IcChevronDown, IcChevronUp } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import type { PopUpControls } from '../../types';

import './ToggleButton.scss';

interface ToggleButtonProps {
    OnIconComponent: (props: Pick<IconProps, 'size'>) => JSX.Element;
    OffIconComponent: (props: Pick<IconProps, 'size'>) => JSX.Element;
    isOn: boolean;
    onClick: () => void;
    isOpen: boolean;
    onPopupButtonClick: () => void;
    Content?: (props: {
        anchorRef: RefObject<HTMLButtonElement>;
        onClose: () => void;
        anchorPosition?: PopperPosition;
    }) => JSX.Element;
    popUp: PopUpControls;
    ariaLabel?: string;
    secondaryAriaLabel?: string;
    hasWarning?: boolean;
    tooltipTitle?: string;
}

export const ToggleButton = ({
    OnIconComponent,
    OffIconComponent,
    isOn,
    onClick,
    isOpen,
    onPopupButtonClick,
    Content,
    ariaLabel,
    secondaryAriaLabel,
    hasWarning,
    tooltipTitle,
}: ToggleButtonProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const rect = containerRef.current?.getBoundingClientRect() ?? { top: 0, left: 0 };

    return (
        <div className="relative" ref={containerRef}>
            <Tooltip
                title={tooltipTitle}
                isOpen={!tooltipTitle ? false : undefined}
                tooltipClassName="toggle-button-tooltip bg-strong color-norm"
                openDelay={750}
                closeDelay={0}
            >
                <button
                    ref={buttonRef}
                    className={clsx(
                        isOn && 'toggle-button-body-on',
                        !isOn && 'toggle-button-body-off',
                        'user-select-none flex flex-nowrap items-center gap-4 text-norm pl-6 pr-1 rounded-full w-custom h-custom'
                    )}
                    style={{ '--w-custom': '7rem', '--h-custom': '3.5rem' }}
                    onClick={onClick}
                    onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
                    aria-label={ariaLabel}
                >
                    {isOn ? <OnIconComponent size={6} /> : <OffIconComponent size={6} />}
                </button>
            </Tooltip>

            <Button
                ref={buttonRef}
                className={clsx(
                    'rounded-50 flex items-center justify-center w-custom h-custom absolute top-custom right-custom cursor-pointer border-none',
                    isOn && 'toggle-button-circle-on',
                    !isOn && 'toggle-button-circle-off',
                    'toggle-button-circle'
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onPopupButtonClick();
                }}
                style={{
                    '--w-custom': '3rem',
                    '--h-custom': '3rem',
                    '--top-custom': '50%',
                    '--right-custom': '0.25rem',
                }}
                aria-label={secondaryAriaLabel}
            >
                {isOpen ? <IcChevronUp size={6} /> : <IcChevronDown size={6} />}
            </Button>
            {hasWarning && (
                <div
                    className={clsx(
                        'warning-indicator rounded-full flex justify-center items-center absolute top-custom left-custom w-custom h-custom color-invert'
                    )}
                    style={{
                        '--w-custom': '1.25rem',
                        '--h-custom': '1.25rem',
                        '--top-custom': '0rem',
                        '--left-custom': '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    !
                </div>
            )}
            <div className="relative flex flex-nowrap items-center flex-column">
                {isOpen && Content && (
                    <Content
                        anchorRef={buttonRef}
                        onClose={onPopupButtonClick}
                        anchorPosition={{ top: rect.top, left: rect.left }}
                    />
                )}
            </div>
        </div>
    );
};
