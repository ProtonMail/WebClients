import { useRef, useState } from 'react';

import type { IconProps } from '@proton/components';
import { IcChevronDown, IcChevronUp } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import './ToggleButton.scss';

interface ToggleButtonProps {
    OnIconComponent: (props: Pick<IconProps, 'viewBox' | 'size'>) => JSX.Element;
    OffIconComponent: (props: Pick<IconProps, 'viewBox' | 'size'>) => JSX.Element;
    isOn: boolean;
    onClick: () => void;
    Content?: () => JSX.Element;
}

export const ToggleButton = ({ OnIconComponent, OffIconComponent, isOn, onClick, Content }: ToggleButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleButtonCircleRef = useRef<HTMLButtonElement>(null);

    return (
        <button
            className={clsx(
                isOn && 'toggle-button-body-on',
                !isOn && 'toggle-button-body-off',
                'flex flex-nowrap items-center gap-4 text-norm pl-6 pr-1 rounded-full w-custom h-custom'
            )}
            style={{ '--w-custom': '7rem', '--h-custom': '3.5rem' }}
            onClick={onClick}
        >
            {isOn ? (
                <OnIconComponent viewBox="0 0 24 24" size={6} />
            ) : (
                <OffIconComponent viewBox="0 0 24 24" size={6} />
            )}
            <div className="relative flex flex-nowrap items-center flex-column">
                {Content && (
                    <button
                        className="toggle-button-hover-content rounded-full bg-weak p-2 z-up absolute left-custom bottom-custom mb-2 cursor-default"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        style={{
                            visibility: isOpen ? 'visible' : 'hidden',
                            maxHeight: isOpen ? undefined : 0,
                            '--left-custom': '-5rem',
                            '--bottom-custom': '100%',
                        }}
                        aria-expanded={isOpen}
                    >
                        <Content />
                    </button>
                )}
                <div
                    // @ts-ignore
                    ref={(el) => (toggleButtonCircleRef.current = el)}
                    className={clsx(
                        'rounded-50 flex items-center justify-center w-custom h-custom',
                        isOn && 'toggle-button-circle-on',
                        !isOn && 'toggle-button-circle-off'
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    style={{ '--w-custom': '48px', '--h-custom': '48px' }}
                >
                    {isOpen ? <IcChevronUp /> : <IcChevronDown />}
                </div>
            </div>
        </button>
    );
};
