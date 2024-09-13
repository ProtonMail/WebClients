import { useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Kbd, Scroll } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon, InputFieldTwo } from '@proton/components';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import Form from '../form/Form';
import type { ModalProps } from '../modalTwo';
import { ModalTwo } from '../modalTwo';
import { Mark } from '../text';

import './Commander.scss';

export interface CommanderItemInterface {
    icon: IconName;
    value: string;
    label: string;
    shortcuts?: string[];
    action: () => void;
}

interface Props extends ModalProps {
    list: CommanderItemInterface[];
    onClose: () => void;
}

const Commander = ({ onClose, list, ...rest }: Props) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const cleanValue = normalize(value);
    const [active, setActive] = useState(0);
    const filteredList = useMemo(() => {
        if (cleanValue.length) {
            return list.filter((item) => {
                const cleanItemLabel = normalize(item.label);
                const cleanItemValue = normalize(item.value);
                return cleanItemLabel.includes(cleanValue) || cleanItemValue.includes(cleanValue);
            });
        }
        return list;
    }, [cleanValue, list]);

    const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        setValue(target.value);
        setActive(0);
    };

    const handleClear = () => {
        setValue('');
        inputRef.current?.focus();
        setActive(0);
    };

    const handleKeyDown = ({ key }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'ArrowDown') {
            setActive((active) => (active + 1) % filteredList.length);
        }
        if (key === 'ArrowUp') {
            setActive((active) => (active - 1 + filteredList.length) % filteredList.length);
        }
        if (key === 'Escape') {
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const item = filteredList[active];

        if (item) {
            filteredList[active].action();
            onClose();
        }
    };

    return (
        <ModalTwo
            className="commander-modal"
            size="small"
            as={Form}
            onClose={onClose}
            onSubmit={handleSubmit}
            enableCloseWhenClickOutside
            {...rest}
        >
            <div className="flex flex-column flex-nowrap h-full">
                <div className="border-bottom commander-search-wrapper py-1 shrink-0">
                    <label className="sr-only" htmlFor="commander-search-input">
                        {c('Label').t`Type a command...`}
                    </label>
                    <InputFieldTwo
                        unstyled
                        dense
                        autoFocus
                        bigger
                        autoComplete="off"
                        className="commander-search-input"
                        inputClassName="h3"
                        type="search"
                        id="commander-search-input"
                        placeholder={c('Placeholder').t`Type a command…`}
                        ref={inputRef}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        prefix={<Icon name="magnifier" size={4.5} alt={c('action').t`Search messages`} />}
                        suffix={
                            <Button
                                type="button"
                                shape="ghost"
                                color="weak"
                                size="small"
                                className="rounded-sm"
                                title={c('Action').t`Clear`}
                                onClick={handleClear}
                            >
                                {c('Action').t`Clear`}
                            </Button>
                        }
                    />
                </div>
                {value !== '' && (
                    <span className="sr-only" aria-atomic="true" aria-live="polite">
                        {c('info').ngettext(
                            msgid`${filteredList.length} command found.`,
                            `${filteredList.length} commands found.`,
                            filteredList.length
                        )}
                    </span>
                )}
                <div className="commander-results-wrapper">
                    <Scroll className="overflow-hidden">
                        {filteredList.length ? (
                            <>
                                <ul className="unstyled mt-2">
                                    {filteredList.map((item, index) => (
                                        <li className="dropdown-item" key={item.value}>
                                            <DropdownMenuButton
                                                onClick={() => {
                                                    item.action();
                                                    onClose();
                                                }}
                                                isSelected={active === index}
                                                className="w-full flex items-center justify-space-between text-left p-3"
                                            >
                                                <span className="flex items-center text-left text-pre">
                                                    <Icon name={item.icon} className="mr-4" />
                                                    <Mark value={value}>{item.label}</Mark>
                                                </span>
                                                <span className="ml-1">
                                                    {item.shortcuts &&
                                                        item.shortcuts.map((shortcut, i) => (
                                                            <Kbd
                                                                key={shortcut}
                                                                shortcut={shortcut}
                                                                className={clsx([i > 0 && 'ml-2'])}
                                                            />
                                                        ))}
                                                </span>
                                            </DropdownMenuButton>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p className="m-4">{c('Info').t`No results found`}</p>
                        )}
                    </Scroll>
                </div>
            </div>
        </ModalTwo>
    );
};

export default Commander;
