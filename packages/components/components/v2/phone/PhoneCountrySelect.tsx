import type { Ref } from 'react';
import { useRef, useState } from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import Icon from '@proton/components/components/icon/Icon';
import { normalize } from '@proton/shared/lib/helpers/string';
import generateUID from '@proton/utils/generateUID';

import CountrySelectRow from './PhoneCountrySelectRow';
import type { CountryOptionData } from './helper';

interface Props {
    options: CountryOptionData[];
    value?: CountryOptionData;
    embedded?: boolean;
    onChange: (newValue: CountryOptionData) => void;
    onClosed?: (isFromSelection: boolean) => void;
}

const cache = new CellMeasurerCache({
    defaultHeight: 100,
    fixedWidth: true,
    keyMapper: () => 0,
});

const CountrySelect = ({ value, options, onChange, embedded, onClosed }: Props) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const normalizedSearch = normalize(search, true);
    const filteredOptions = options.filter(({ countryName }) => {
        return normalize(countryName, true).includes(normalizedSearch);
    });

    const selectedIndex = !value ? 0 : filteredOptions.indexOf(value);

    const pickRef = useRef(false);

    const handleChange = (value: CountryOptionData) => {
        onChange(value);
        setIsOpen(false);
        pickRef.current = true;
    };

    const uid = generateUID('phone-number-prefix');

    return (
        <>
            <span className="sr-only" id={uid}>{c('Info').t`Country code`}</span>
            <DropdownButton
                as="button"
                type="button"
                isOpen={isOpen}
                hasCaret
                onClick={() => {
                    pickRef.current = false;
                    setIsOpen(!isOpen);
                }}
                className="unstyled self-stretch my-1 pr-2 border-right"
                ref={anchorRef}
                caretClassName="my-auto"
                aria-live="assertive"
                aria-atomic="true"
                aria-label={value?.countryName}
                aria-describedby={uid}
            >
                <span className="flex mr-2">
                    {!value ? (
                        <Icon name="globe" className="align-middle inline-flex" />
                    ) : (
                        <img
                            role="presentation"
                            alt={value.countryName}
                            src={value.countryFlag}
                            width="30"
                            height="30"
                            className="align-middle inline-flex"
                        />
                    )}
                </span>
                <span className="min-w-custom inline-flex" style={{ '--min-w-custom': '3em' }} dir="ltr">
                    +{value ? value.countryCallingCode : '00'}
                </span>
            </DropdownButton>

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    pickRef.current = false;
                    setIsOpen(false);
                }}
                onClosed={() => {
                    setSearch('');
                    onClosed?.(pickRef.current);
                }}
                offset={4}
                autoClose={false}
                noCaret
                disableDefaultArrowNavigation
                onKeyDown={(e) => {
                    const { key } = e;
                    switch (key) {
                        case 'Enter': {
                            e.preventDefault();
                            pickRef.current = true;
                            setIsOpen(false);
                            break;
                        }
                        case 'ArrowUp': {
                            e.preventDefault();
                            const newIndex = selectedIndex - 1;
                            const newValue = filteredOptions[Math.max(newIndex, 0)];
                            if (newValue) {
                                onChange(newValue);
                            }
                            break;
                        }
                        case 'ArrowDown': {
                            e.preventDefault();
                            const newIndex = selectedIndex + 1;
                            const newValue = filteredOptions[Math.min(newIndex, filteredOptions.length - 1)];
                            if (newValue) {
                                onChange(newValue);
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }}
            >
                <form name="search" className="p-4">
                    <Input
                        id="search-keyword"
                        value={search}
                        onValue={setSearch}
                        autoFocus={!embedded}
                        placeholder="Country"
                        prefix={<Icon name="magnifier" alt={c('Action').t`Search countries`} />}
                    />
                </form>

                <div className="h-custom min-w-custom" style={{ '--h-custom': '20em', '--min-w-custom': '18em' }}>
                    {!filteredOptions.length ? (
                        <div className="pl-4" role="alert">{c('Info').t`No results found`}</div>
                    ) : (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    height={height}
                                    width={width}
                                    rowHeight={cache.rowHeight}
                                    className="unstyled m-0 p-0 overflow-auto"
                                    scrollToIndex={selectedIndex < 0 ? 0 : selectedIndex}
                                    rowCount={filteredOptions.length}
                                    rowRenderer={({ index, key, parent, style }) => {
                                        return (
                                            <CellMeasurer
                                                cache={cache}
                                                columnIndex={0}
                                                key={key}
                                                rowIndex={index}
                                                parent={parent}
                                            >
                                                {({ registerChild }) => (
                                                    <CountrySelectRow
                                                        ref={registerChild as Ref<HTMLDivElement>}
                                                        data={filteredOptions[index]}
                                                        value={value}
                                                        key={key}
                                                        style={style}
                                                        onChange={handleChange}
                                                    />
                                                )}
                                            </CellMeasurer>
                                        );
                                    }}
                                />
                            )}
                        </AutoSizer>
                    )}
                </div>
            </Dropdown>
        </>
    );
};

export default CountrySelect;
