import { c } from 'ttag';

import { Dropdown, Icon, usePopperAnchor } from '@proton/components';

import { PROJECT_ICONS } from '../constants';

import './IconPicker.scss';

interface IconPickerProps {
    selectedIcon: string;
    onSelectIcon: (icon: string) => void;
}

export const IconPicker = ({ selectedIcon, onSelectIcon }: IconPickerProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleIconSelect = (icon: string) => {
        onSelectIcon(icon);
        close();
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggle();
    };

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                className="icon-picker-trigger flex items-center justify-center shrink-0 w-custom h-custom border-none rounded bg-transparent cursor-pointer color-norm"
                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' } as React.CSSProperties}
                onClick={handleToggle}
                aria-label={c('collider_2025:Action').t`Choose project icon`}
                title={c('collider_2025:Tooltip').t`Choose icon`}
            >
                <Icon name={selectedIcon as any} size={5} />
            </button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <div className="p-3">
                    <div className="icon-picker-grid">
                        {PROJECT_ICONS.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className={`icon-picker-option flex items-center justify-center w-custom h-custom border-none rounded-lg cursor-pointer ${selectedIcon === icon ? 'is-selected' : ''}`}
                                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' } as React.CSSProperties}
                                onClick={() => handleIconSelect(icon)}
                                aria-label={icon}
                            >
                                <Icon name={icon as any} size={5} />
                            </button>
                        ))}
                    </div>
                </div>
            </Dropdown>
        </>
    );
};
