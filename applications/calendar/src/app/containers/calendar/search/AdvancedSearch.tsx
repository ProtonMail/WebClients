import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { fromUnixTime, getUnixTime } from 'date-fns';
import { History } from 'history';
import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { extractSearchParameters, generatePathnameWithSearchParams } from '../../../helpers/encryptedSearch/esUtils';
import CalendarSearchActivation from './CalendarSearchActivation';
import CalendarSearchForm from './CalendarSearchForm';
import SearchField from './SearchField';
import { SearchModel } from './interface';

const DEFAULT_MODEL: SearchModel = {
    keyword: '',
};

const initializeModel = (history: History, searchInputValue: string) => () => {
    const { keyword, begin, end } = extractSearchParameters(history.location);

    return {
        keyword: searchInputValue ? keyword || '' : '',
        startDate: begin !== undefined ? fromUnixTime(+begin) : undefined,
        endDate: end !== undefined ? fromUnixTime(+end) : undefined,
    };
};

interface Props {
    // calendars: VisualCalendar[];
    isNarrow: boolean;
    containerRef: HTMLDivElement | null;
    isIndexing: boolean;
    isSearchActive: boolean;
    onClose: () => void;
    showMore: boolean;
    toggleShowMore: () => void;
    searchInputValue: string;
}

const AdvancedSearch = ({
    isNarrow,
    containerRef,
    isIndexing,
    isSearchActive,
    onClose,
    showMore,
    searchInputValue,
    toggleShowMore,
}: Props) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const history = useHistory();
    const [model, updateModel] = useState<SearchModel>(initializeModel(history, searchInputValue));

    const handleSearch = ({ target }: ChangeEvent<HTMLInputElement>) => {
        if (!isSearchActive) {
            return;
        }
        updateModel({ ...model, keyword: target.value });
    };

    const handleSubmit = (event: FormEvent, reset?: boolean) => {
        event.preventDefault(); // necessary to not run a basic submission
        event.stopPropagation(); // necessary to not submit normal search from header

        const { keyword, startDate, endDate } = reset ? DEFAULT_MODEL : model;

        history.push(
            generatePathnameWithSearchParams(history.location, {
                keyword,
                begin: startDate ? `${getUnixTime(startDate)}` : undefined,
                end: endDate ? `${getUnixTime(endDate)}` : undefined,
            })
        );

        onClose();
    };

    const handleClear = () => {
        updateModel((currentModel) => ({ ...currentModel, keyword: '' }));
        searchInputRef.current?.focus();
    };

    const handleReset = (event: FormEvent) => {
        event.preventDefault(); // necessary to block native reset behaviour

        updateModel(DEFAULT_MODEL);
        searchInputRef.current?.focus();
    };

    const canReset = !!(model.keyword || model.startDate || model.endDate);

    // Taken from the useClickMailContent component
    // '' mousedown and touchstart avoid issue with the click in portal (modal, notification, dropdown) ''
    useEffect(() => {
        if (!containerRef) {
            return;
        }
        containerRef.addEventListener('mousedown', onClose, { passive: true });
        containerRef.addEventListener('touchstart', onClose, { passive: true });

        return () => {
            containerRef.removeEventListener('mousedown', onClose);
            containerRef.removeEventListener('touchstart', onClose);
        };
    }, [containerRef]);

    return (
        <form name="advanced-search" onSubmit={handleSubmit} onReset={handleReset}>
            <div className="flex border-bottom px-1 pt-1 pb-2">
                <SearchField
                    unstyled
                    value={model.keyword}
                    onChange={handleSearch}
                    onSubmit={handleSubmit}
                    showSearchIcon={false}
                    ref={searchInputRef}
                    suffix={
                        model.keyword ? (
                            <Button
                                shape="ghost"
                                color="weak"
                                size="small"
                                type="button"
                                data-testid="advanced-search:clear"
                                onClick={handleClear}
                            >
                                {c('Action').t`Clear`}
                            </Button>
                        ) : null
                    }
                />
            </div>
            {!isSearchActive ? (
                <CalendarSearchActivation isIndexing={isIndexing} onClose={onClose} />
            ) : (
                <CalendarSearchForm
                    model={model}
                    isNarrow={isNarrow}
                    showMore={showMore}
                    canReset={canReset}
                    updateModel={updateModel}
                    toggleShowMore={toggleShowMore}
                />
            )}
        </form>
    );
};

export default AdvancedSearch;
