import { MouseEvent } from 'react';
import { c } from 'ttag';
import { COLORS } from '@proton/shared/lib/calendar/constants';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '../dropdown';
import { LabelDescription } from './LabelStack';
import { usePopperAnchor } from '../popper';
import { Icon } from '../icon';

interface Props {
    label: LabelDescription;
    showDropdown?: boolean;
    showDelete?: boolean;
}

const LabelStackItem = ({ label, showDelete = false, showDropdown = false }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleLabelClick = (e: MouseEvent<HTMLButtonElement>) => {
        if (showDropdown) {
            toggle();
        } else if (label.onClick) {
            label.onClick(e);
        }
    };

    const handleLabelOpen = (e: MouseEvent<HTMLButtonElement>) => {
        if (label.onClick) {
            e.stopPropagation();
            label.onClick(e);
            close();
        }
    };

    const handleLabelRemove = (e: MouseEvent<HTMLButtonElement>) => {
        if (label.onDelete) {
            e.stopPropagation();
            label.onDelete(e);
            close();
        }
    };

    return (
        <li
            className="label-stack-item flex flex-row flex-align-items-center flex-justify-start flex-nowrap"
            style={
                label.color
                    ? {
                          '--background': label.color,
                          // TODO: Use white for now, re-introduce the readability calculation as soon as possible
                          '--foreground': COLORS.WHITE,
                      }
                    : undefined
            }
        >
            {label.onClick ? (
                <button
                    type="button"
                    className="label-stack-item-button text-ellipsis"
                    onClick={(e) => handleLabelClick(e)}
                    title={label.title}
                    ref={anchorRef}
                >
                    <span className="label-stack-item-button-text">{label.name}</span>
                </button>
            ) : (
                <span className="label-stack-item-button text-ellipsis" title={label.title}>
                    <span className="label-stack-item-button-text">{label.name}</span>
                </span>
            )}

            {showDelete && (
                <button
                    type="button"
                    className="label-stack-item-delete flex-item-noshrink"
                    onClick={label.onDelete}
                    title={`${c('Action').t`Remove`} ${label.title}`}
                >
                    <Icon name="xmark" size={12} className="label-stack-item-delete-icon" alt={c('Action').t`Remove`} />
                </button>
            )}

            {showDropdown && (
                <Dropdown anchorRef={anchorRef} isOpen={isOpen} originalPlacement="bottom" onClose={close}>
                    <DropdownMenu>
                        <DropdownMenuButton className="text-left flex flex-nowrap" onClick={(e) => handleLabelOpen(e)}>
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Go to label`}</span>
                        </DropdownMenuButton>
                        {label.onDelete && (
                            <>
                                <hr className="my0-5" />

                                <DropdownMenuButton
                                    className="text-left flex flex-nowrap"
                                    onClick={(e) => handleLabelRemove(e)}
                                    title={`${c('Action').t`Remove`} ${label.title}`}
                                >
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Remove`}</span>
                                </DropdownMenuButton>
                            </>
                        )}
                    </DropdownMenu>
                </Dropdown>
            )}
        </li>
    );
};

export default LabelStackItem;
