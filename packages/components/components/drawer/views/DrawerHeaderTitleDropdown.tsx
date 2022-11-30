import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    usePopperAnchor,
} from '@proton/components/components';
import { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import { classnames } from '@proton/components/helpers';

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
                className={classnames(['drawer-header-button'])}
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
                        >
                            <span className="ml0-5 mtauto mbauto flex-item-fluid">{option.text}</span>
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default DrawerHeaderTitleDropdown;
