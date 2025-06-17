import { useRef } from 'react';

import { Button } from '@proton/atoms';
import type { IconProps } from '@proton/components';
import { IcChevronDown, IcChevronUp } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { useMeetContext } from '../../contexts/MeetContext';
import { type PopUpControls } from '../../types';

import './ToggleButton.scss';

interface ToggleButtonProps {
    OnIconComponent: (props: Pick<IconProps, 'size'>) => JSX.Element;
    OffIconComponent: (props: Pick<IconProps, 'size'>) => JSX.Element;
    isOn: boolean;
    onClick: () => void;
    Content?: () => JSX.Element;
    popUp: PopUpControls;
    ariaLabel?: string;
    secondaryAriaLabel?: string;
}

export const ToggleButton = ({
    OnIconComponent,
    OffIconComponent,
    isOn,
    onClick,
    Content,
    popUp,
    ariaLabel,
    secondaryAriaLabel,
}: ToggleButtonProps) => {
    const toggleButtonCircleRef = useRef<HTMLButtonElement | null>(null);

    const { popupState, togglePopupState } = useMeetContext();

    const isOpen = popupState[popUp];

    return (
        <div className="relative">
            <button
                className={clsx(
                    isOn && !isOpen && 'toggle-button-body-on',
                    !isOn && 'toggle-button-body-off',
                    'flex flex-nowrap items-center gap-4 text-norm pl-6 pr-1 rounded-full w-custom h-custom'
                )}
                style={{ '--w-custom': '7rem', '--h-custom': '3.5rem' }}
                onClick={onClick}
                aria-label={ariaLabel}
            >
                {isOn ? <OnIconComponent size={6} /> : <OffIconComponent size={6} />}
            </button>
            <Button
                ref={(el) => (toggleButtonCircleRef.current = el)}
                className={clsx(
                    'rounded-50 flex items-center justify-center w-custom h-custom absolute top-custom right-custom cursor-pointer border-none',
                    isOn && 'toggle-button-circle-on',
                    !isOn && 'toggle-button-circle-off',
                    'toggle-button-circle'
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    togglePopupState(popUp);
                }}
                style={{
                    '--w-custom': '3rem',
                    '--h-custom': '3rem',
                    '--top-custom': '50%',
                    '--right-custom': '0.25rem',
                }}
                aria-label={secondaryAriaLabel}
            >
                {isOpen ? <IcChevronUp /> : <IcChevronDown />}
            </Button>
            <div className="relative flex flex-nowrap items-center flex-column">
                {Content && (
                    <button
                        className="toggle-button-hover-content rounded-full p-2 z-up absolute left-custom bottom-custom mb-2 cursor-default"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        style={{
                            visibility: isOpen ? 'visible' : 'hidden',
                            maxHeight: isOpen ? undefined : 0,
                            '--left-custom': '-1rem',
                            '--bottom-custom': '4rem',
                        }}
                        aria-expanded={isOpen}
                    >
                        <Content />
                    </button>
                )}
            </div>
        </div>
    );
};
