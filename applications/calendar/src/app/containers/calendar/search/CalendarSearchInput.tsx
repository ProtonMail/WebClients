import { FormEvent, KeyboardEvent, MouseEvent, Ref, RefObject, forwardRef, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { ToolbarButton } from '@proton/components/components/toolbar';

import { useCalendarSearch } from './CalendarSearchProvider';

interface Props {
    value: string;
    setValue: (value: string) => void;
    loading: boolean;
    onSearch: () => void;
    onBack: () => void;
    isSearchActive: boolean;
    searchRef?: RefObject<HTMLDivElement>;
}

const CalendarSearchInput = (
    { value: inputValue, setValue, loading, onSearch, onBack, isSearchActive, searchRef }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const { search, searchParams } = useCalendarSearch();

    const inputRef = useRef<HTMLInputElement>(null);

    const placeholder = isSearchActive ? c('Placeholder').t`Search events` : c('Placeholder').t`Indexing...`;
    const trimmedKeyword = inputValue.trim();
    const previousKeyword = searchParams.keyword;
    const cannotSearch = !trimmedKeyword || trimmedKeyword === previousKeyword || !isSearchActive || loading;

    const handleChange = (event: FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    const handleClear = () => {
        setValue('');
        inputRef.current?.focus();
    };

    const handleSearch = () => {
        if (cannotSearch) {
            return;
        }

        search({
            keyword: inputValue.trim(),
        });
        onSearch();
    };

    const handleOnKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
            event.preventDefault();
        }
        if (event.key === 'Escape') {
            onBack();
            event.preventDefault();
        }
    };

    const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onBack();
    };

    useEffect(() => {
        // focus right after indexation
        if (isSearchActive) {
            inputRef.current?.focus();
        }
    }, [isSearchActive]);

    return (
        <>
            <ToolbarButton
                icon={<Icon name="arrow-left" alt={c('Action').t`Back`} />}
                className="mr-2"
                onClick={handleBack}
            />
            <div className="flex flex-nowrap gap-2" ref={searchRef}>
                <div
                    className="searchbox flex max-w-custom"
                    role="search"
                    style={{ '--max-w-custom': '360px' }}
                    ref={ref}
                >
                    <div className="w100 m-auto">
                        <Input
                            ref={inputRef}
                            inputClassName="cursor-text"
                            value={inputValue}
                            placeholder={placeholder}
                            onChange={handleChange}
                            onKeyDown={handleOnKeyDown}
                            onSubmit={handleSearch}
                            data-testid="search-keyword"
                            autoFocus
                            disabled={!isSearchActive}
                            prefix={
                                loading ? (
                                    <Icon name="arrow-rotate-right" className="location-refresh-rotate" />
                                ) : (
                                    <Icon name="magnifier" alt={c('Action').t`Search`} />
                                )
                            }
                            suffix={
                                inputValue.length ? (
                                    <Button
                                        type="button"
                                        shape="ghost"
                                        color="weak"
                                        size="small"
                                        className="rounded-sm"
                                        disabled={loading}
                                        title={c('Action').t`Clear search`}
                                        onClick={handleClear}
                                        data-testid="clear-button"
                                    >
                                        {c('Action').t`Clear`}
                                    </Button>
                                ) : null
                            }
                        />
                    </div>
                </div>
                <Button
                    type="submit"
                    shape="solid"
                    color="norm"
                    onClick={handleSearch}
                    disabled={cannotSearch}
                    className="no-mobile"
                >{c('Action').t`Search`}</Button>
            </div>
        </>
    );
};

export default forwardRef(CalendarSearchInput);
