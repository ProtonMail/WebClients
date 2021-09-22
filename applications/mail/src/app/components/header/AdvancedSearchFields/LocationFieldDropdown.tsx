import { c } from 'ttag';
import { useRef } from 'react';
import {
    classnames,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    generateUID,
    usePopperAnchor,
} from '@proton/components';

import useLocationFieldOptions from './useLocationFieldOptions';

interface Props {
    value: string;
    onChange: (selectedOptionValue: string) => void;
}

const LocationFieldDropdown = ({ value, onChange }: Props) => {
    const { current: uid } = useRef(generateUID('advanced-search-location-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { grouped: optionGroups } = useLocationFieldOptions();

    return (
        <>
            <DropdownButton
                className={classnames(['no-border', 'rounded'])}
                color="weak"
                hasCaret
                onClick={toggle}
                size="small"
                shape="solid"
                ref={anchorRef}
                type="button"
            >
                {c('Property type').t`Other`}
            </DropdownButton>
            <Dropdown
                anchorRef={anchorRef}
                autoClose
                id={uid}
                isOpen={isOpen}
                onClose={close}
                originalPlacement="bottom-left"
            >
                <DropdownMenu>
                    {optionGroups.map((group) =>
                        group.items.length ? (
                            <div key={group.id}>
                                <span className="button text-bold pl1">{group.title}</span>
                                {group.items.map((item) => (
                                    <DropdownMenuButton
                                        className="text-left pl2"
                                        isSelected={item.value === value}
                                        key={item.value}
                                        onClick={() => onChange(item.value)}
                                    >
                                        {item.text}
                                    </DropdownMenuButton>
                                ))}
                            </div>
                        ) : null
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default LocationFieldDropdown;
