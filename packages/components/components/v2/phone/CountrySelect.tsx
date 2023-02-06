import { Ref, useRef, useState } from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

import { c } from 'ttag';

import { generateUID } from '@proton/components/helpers';
import { normalize } from '@proton/shared/lib/helpers/string';

import { Dropdown, DropdownButton } from '../../dropdown';
import { Icon } from '../../icon';
import InputTwo from '../input/Input';
import CountrySelectRow from './CountrySelectRow';
import { CountryOptionData } from './helper';

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
                className="unstyled flex-align-self-stretch my0-25 pr0-5 border-right"
                ref={anchorRef}
                caretClassName="myauto"
                aria-live="assertive"
                aria-atomic="true"
                aria-label={value?.countryName}
                aria-describedby={uid}
            >
                <span className="flex mr0-5">
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
                <span className="min-w3e inline-flex" dir="ltr">
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
                            onChange(filteredOptions[Math.max(newIndex, 0)]);
                            break;
                        }
                        case 'ArrowDown': {
                            e.preventDefault();
                            const newIndex = selectedIndex + 1;
                            onChange(filteredOptions[Math.min(newIndex, filteredOptions.length - 1)]);
                            break;
                        }
                        default:
                            break;
                    }
                }}
            >
                <form name="search" className="p1">
                    <InputTwo
                        id="search-keyword"
                        value={search}
                        onValue={setSearch}
                        autoFocus={!embedded}
                        placeholder="Country"
                        prefix={<Icon name="magnifier" alt={c('Action').t`Search countries`} />}
                    />
                </form>

                <div
                    className="h-custom min-w-custom"
                    style={{ '--height-custom': '20em', '--min-width-custom': '18em' }}
                >
                    {!filteredOptions.length ? (
                        <div className="pl1" role="alert">{c('Info').t`No results found`}</div>
                    ) : (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    height={height}
                                    width={width}
                                    rowHeight={cache.rowHeight}
                                    className="unstyled m0 p0 scroll-if-needed"
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
