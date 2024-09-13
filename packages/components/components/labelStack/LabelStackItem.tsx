import type { MouseEvent } from 'react';

import tinycolor from 'tinycolor2';
import { c } from 'ttag';

import { genAccentShades } from '@proton/colors';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

import { Icon } from '../icon';
import { usePopperAnchor } from '../popper';
import type { LabelDescription } from './LabelStack';

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

    const [base, hover, active] = genAccentShades(tinycolor(label.color)).map((c) => c.toHexString());

    return (
        <li
            className="label-stack-item flex flex-row items-stretch justify-start flex-nowrap"
            style={
                label.color
                    ? {
                          '--label-bg': base,
                          '--label-bg-hover': hover,
                          '--label-bg-active': active,
                      }
                    : undefined
            }
            data-testid={`label-item:container-${label.name}`}
        >
            {label.onClick ? (
                <button
                    type="button"
                    className={clsx([
                        'label-stack-item-inner label-stack-item-button text-ellipsis',
                        showDelete && 'with-delete',
                    ])}
                    onClick={(e) => handleLabelClick(e)}
                    title={label.title}
                    ref={anchorRef}
                    data-testid="label-item:body-button"
                >
                    <span className="label-stack-item-text">{label.name}</span>
                </button>
            ) : (
                <span className="label-stack-item-inner text-ellipsis" title={label.title}>
                    <span className="label-stack-item-text">{label.name}</span>
                </span>
            )}

            {showDelete && (
                <button
                    type="button"
                    className="label-stack-item-delete label-stack-item-button shrink-0"
                    onClick={label.onDelete}
                    title={`${c('Action').t`Remove`} ${label.title}`}
                    data-testid="label-item:close-button"
                >
                    <Icon name="cross-small" className="label-stack-item-delete-icon" alt={c('Action').t`Remove`} />
                </button>
            )}

            {showDropdown && (
                <Dropdown
                    anchorRef={anchorRef}
                    isOpen={isOpen}
                    originalPlacement="bottom"
                    onClose={close}
                    data-testid="label-item:dropdown-button"
                >
                    <DropdownMenu>
                        <DropdownMenuButton
                            className="text-left "
                            onClick={(e) => handleLabelOpen(e)}
                            title={`${c('Action').t`Go to label`} ${label.title}`}
                            data-testid="label-item:dropdown--open-label"
                        >
                            {c('Action').t`Go to label`}
                        </DropdownMenuButton>
                        {label.onDelete && <hr className="my-1" aria-hidden="true" />}
                        {label.onDelete && (
                            <DropdownMenuButton
                                className="text-left"
                                onClick={(e) => handleLabelRemove(e)}
                                title={`${c('Action').t`Remove`} ${label.title}`}
                                data-testid="label-item:dropdown--remove-label"
                            >
                                {c('Action').t`Remove`}
                            </DropdownMenuButton>
                        )}
                    </DropdownMenu>
                </Dropdown>
            )}
        </li>
    );
};

export default LabelStackItem;
