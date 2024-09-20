import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    options: SelectedDrawerOption[];
    onClickOption?: (value: SelectedDrawerOption) => void;
}

const DrawerHeaderTitleDropdown = ({ title, options, onClickOption }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                type="button"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret
                shape="ghost"
                size="small"
                className={clsx(['drawer-header-button'])}
                data-testid="drawer-app-header-actions:dropdown"
            >
                {title}
            </DropdownButton>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu className="shrink-0">
                    {options.map((option, index) => (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => onClickOption?.(option)}
                            key={index}
                            data-testid={`drawer-app-header-actions:${option.text}`}
                        >
                            <span className="ml-2 my-auto flex-1">{option.text}</span>
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default DrawerHeaderTitleDropdown;
