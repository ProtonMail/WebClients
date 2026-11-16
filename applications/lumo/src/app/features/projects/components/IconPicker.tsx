import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';

import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { PROJECT_ICONS } from '../constants';

import './IconPicker.scss';

interface IconPickerProps {
    selectedIcon: string;
    onSelectIcon: (icon: string) => void;
    /** Accessible name of the trigger; defaults to choosing a project icon. */
    label?: string;
    disabled?: boolean;
    /** `small` fits inside a text field, e.g. as its prefix. */
    size?: 'small' | 'medium';
}

export const IconPicker = ({
    selectedIcon,
    onSelectIcon,
    label,
    disabled = false,
    size = 'medium',
}: IconPickerProps) => {
    const triggerSize = size === 'small' ? '1.75rem' : '2.5rem';
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
                style={{ '--w-custom': triggerSize, '--h-custom': triggerSize } as React.CSSProperties}
                onClick={handleToggle}
                disabled={disabled}
                aria-label={label ?? c('collider_2025:Action').t`Choose project icon`}
                title={c('collider_2025:Tooltip').t`Choose icon`}
            >
                <ProjectIcon iconId={selectedIcon} size={size === 'small' ? 16 : 20} />
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
                                <ProjectIcon iconId={icon} size={20} />
                            </button>
                        ))}
                    </div>
                </div>
            </Dropdown>
        </>
    );
};
