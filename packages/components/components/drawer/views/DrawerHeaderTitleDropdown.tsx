import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    usePopperAnchor,
} from '@proton/components/components';
import { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
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
                <DropdownMenu className="flex-item-noshrink">
                    {options.map((option, index) => (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-align-items-center"
                            onClick={() => onClickOption?.(option)}
                            key={index}
                            data-testid={`drawer-app-header-actions:${option.text}`}
                        >
                            <span className="ml-2 my-auto flex-item-fluid">{option.text}</span>
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default DrawerHeaderTitleDropdown;
