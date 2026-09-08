import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownSizeUnit } from '@proton/components/index';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { LayoutOptions } from './LayoutOptions';
import { useLayoutOptions } from './useLayoutOptions';

// Used in MenuButton for small screens
export const LayoutMenuItem = ({ onLayoutSelected }: { onLayoutSelected: () => void }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { selectedOption } = useLayoutOptions();

    const SelectedIcon = selectedOption.Icon;
    const selectedLabel = selectedOption.label;

    return (
        <>
            <Button
                ref={anchorRef}
                className="text-left flex items-center gap-4 menu-item w-full px-0"
                onClick={toggle}
                shape="ghost"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <SelectedIcon size={6} />
                <span className="text-lg">{c('Alt').t`Layout: ${selectedLabel}`}</span>
                <IcChevronRight className="ml-auto shrink-0" size={5} />
            </Button>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="meet-dropdown meet-radius border border-card shadow-none"
                originalPlacement="top-start"
                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: undefined }}
                noCaret
            >
                <LayoutOptions
                    onClose={() => {
                        close();
                        onLayoutSelected();
                    }}
                />
            </Dropdown>
        </>
    );
};
