import { useRef, useState } from 'react';

import { Button } from '@proton/atoms';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton } from '@proton/components/components';
import { DropdownButtonProps } from '@proton/components/components/dropdown/DropdownButton';
import useUid from '@proton/components/hooks/useUid';

import { SpamListAction } from './Spams.interfaces';

interface Props {
    title: string;
    actions: SpamListAction[];
    buttonProps?: DropdownButtonProps<typeof Button>;
}

const SpamsButtonDropdown = ({ title, actions, buttonProps }: Props) => {
    const uid = useUid();
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <DropdownButton
                as={Button}
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                ref={anchorRef}
                type="button"
                {...buttonProps}
            >
                {title}
            </DropdownButton>
            <Dropdown
                anchorRef={anchorRef}
                disableDefaultArrowNavigation
                id={uid}
                isOpen={isOpen}
                onClose={() => setIsOpen(!isOpen)}
            >
                <DropdownMenu>
                    {actions.map((action, index) => (
                        <DropdownMenuButton key={index} className="text-left" onClick={action.onClick}>
                            {action.name}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default SpamsButtonDropdown;
