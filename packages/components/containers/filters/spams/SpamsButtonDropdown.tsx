import { useRef, useState } from 'react';

import { Button } from '@proton/atoms';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import type { DropdownButtonProps } from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import useUid from '@proton/components/hooks/useUid';

import type { SpamListAction } from './Spams.interfaces';

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
