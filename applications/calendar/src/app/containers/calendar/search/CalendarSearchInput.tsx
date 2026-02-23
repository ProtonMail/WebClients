import type { FormEvent, KeyboardEvent, MouseEvent, Ref, RefObject } from 'react';
import { forwardRef, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useSearchTelemetry } from '@proton/encrypted-search/lib/useSearchTelemetry';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

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
    const { sendClearSearchFieldsReport } = useSearchTelemetry();

    const { viewportWidth } = useActiveBreakpoint();

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
        sendClearSearchFieldsReport(true);
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

    const searchText = c('Action').t`Search`;

    const prefixInputSearch = viewportWidth['<=small'] ? (
        <Button
            type="submit"
            shape="ghost"
            icon
            size="small"
            onClick={handleSearch}
            disabled={cannotSearch}
            className="shrink-0"
            title={searchText}
        >
            <IcMagnifier alt={searchText} />
        </Button>
    ) : (
        <IcMagnifier alt={searchText} className="shrink-0" />
    );

    return (
        <>
            <ToolbarButton
                icon={<IcArrowLeft alt={c('Action').t`Back`} />}
                className="mr-2"
                onClick={handleBack}
                title={c('Action').t`Back`}
            />
            <div className="flex flex-nowrap gap-2" ref={searchRef}>
                <div
                    className="searchbox flex max-w-custom"
                    role="search"
                    style={{ '--max-w-custom': '22.5rem' }}
                    ref={ref}
                >
                    <div className="w-full m-auto">
                        <label htmlFor="search-keyword-field" className="sr-only">
                            {placeholder}
                        </label>
                        <Input
                            ref={inputRef}
                            inputClassName="cursor-text"
                            value={inputValue}
                            placeholder={placeholder}
                            onChange={handleChange}
                            onKeyDown={handleOnKeyDown}
                            onSubmit={handleSearch}
                            data-testid="search-keyword"
                            id="search-keyword-field"
                            autoFocus
                            disabled={!isSearchActive}
                            inputContainerClassName="self-center"
                            prefix={
                                loading ? <IcArrowRotateRight className="location-refresh-rotate" /> : prefixInputSearch
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
                                        icon={viewportWidth['<=small']}
                                    >
                                        <span className="hidden md:flex">{c('Action').t`Clear`}</span>
                                        <IcCrossBig className="md:hidden" />
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
                    className="hidden md:inline-flex shrink-0"
                >
                    {searchText}
                </Button>
            </div>
        </>
    );
};

export default forwardRef(CalendarSearchInput);
