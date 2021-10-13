import { c } from 'ttag';
import { useEffect, useRef, useState } from 'react';
import {
    classnames,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    FolderIcon,
    generateUID,
    Icon,
    Mark,
    SearchInput,
    usePopperAnchor,
} from '@proton/components';

import { useLocationFieldOptions, ItemsGroup } from './useLocationFieldOptions';

interface Props {
    value: string;
    onChange: (selectedOptionValue: string) => void;
}

const LocationFieldDropdown = ({ value, onChange }: Props) => {
    const { grouped: optionGroups, isLabel, isCustomFolder, isDefaultFolder } = useLocationFieldOptions();
    const [search, setSearch] = useState('');
    const [options, setOptions] = useState(optionGroups);

    const { current: uid } = useRef(generateUID('advanced-search-location-dropdown'));
    const { current: searchInputID } = useRef(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    useEffect(() => {
        const lowerCaseSearch = search.toLowerCase();
        const nextOptions = optionGroups.map((optionGroup) => {
            return {
                ...optionGroup,
                // @ts-expect-error typescript signature conflict between the different items type
                items: optionGroup.items.filter((item) => item.text.toLowerCase().includes(lowerCaseSearch)),
            };
        });
        setOptions(nextOptions as ItemsGroup);
    }, [search]);

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
                onClosed={() => setSearch('')}
                id={uid}
                isOpen={isOpen}
                onClose={close}
                originalPlacement="bottom-left"
                contentProps={{
                    className: 'flex flex-column flex-nowrap',
                }}
            >
                <div className="p1 flex-item-noshrink">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        onClick={(e) => {
                            // Prevent dropdown closing
                            e.stopPropagation();
                        }}
                        id={searchInputID}
                        placeholder={c('Placeholder').t`Filter folders`}
                        autoFocus
                        data-prevent-arrow-navigation
                    />
                </div>
                <div className="scroll-if-needed scroll-smooth-touch">
                    <DropdownMenu>
                        {options.map((group) =>
                            group.items.length ? (
                                <div key={group.id}>
                                    <span className="button text-bold pl1">{group.title}</span>
                                    {group.items.map((item) => (
                                        <DropdownMenuButton
                                            className="text-left text-ellipsis"
                                            isSelected={item.value === value}
                                            key={item.value}
                                            onClick={() => onChange(item.value)}
                                        >
                                            <div
                                                className={classnames([
                                                    'flex flex-nowrap flex-align-items-center',
                                                    isCustomFolder(item) && item.className,
                                                ])}
                                            >
                                                {isLabel(item) && (
                                                    <Icon
                                                        name="circle-filled"
                                                        size={12}
                                                        color={item.color}
                                                        className="flex-item-noshrink mr0-5"
                                                    />
                                                )}
                                                {isDefaultFolder(item) && (
                                                    <Icon name={item.icon} className="flex-item-noshrink mr0-5" />
                                                )}
                                                {isCustomFolder(item) && (
                                                    <FolderIcon folder={item.folderEntity} className="mr0-5" />
                                                )}
                                                <span className="text-ellipsis">
                                                    <Mark value={search}>{item.text}</Mark>
                                                </span>
                                            </div>
                                        </DropdownMenuButton>
                                    ))}
                                </div>
                            ) : null
                        )}
                    </DropdownMenu>
                </div>
            </Dropdown>
        </>
    );
};

export default LocationFieldDropdown;
