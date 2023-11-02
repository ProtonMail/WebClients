import { Dispatch, SetStateAction } from 'react';

import { isAfter, isBefore } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { DateInput, Label, PrimaryButton } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { useCalendarSearch } from './CalendarSearchProvider';
import { SearchModel } from './interface';

/**
 * TODO: Support searching in specific time range to turn this to false
 */
const HIDE_SEARCH_FORM = true;

interface Props {
    model: SearchModel;
    isNarrow: boolean;
    showMore: boolean;
    canReset: boolean;
    updateModel: Dispatch<SetStateAction<SearchModel>>;
    toggleShowMore: () => void;
}

const CalendarSearchForm = ({ model, isNarrow, showMore, canReset, updateModel, toggleShowMore }: Props) => {
    const { loading } = useCalendarSearch();

    return (
        <>
            <div className="pt-4 px-5 pb-0">
                {showMore && (
                    <>
                        <div className="mt-4">
                            <Button
                                className="mb-2 w-full md:w-auto"
                                onClick={toggleShowMore}
                                data-testid="advanced-search:show-less"
                                title={c('Action').t`Show fewer search options`}
                            >
                                {c('Action').t`Fewer search options`}
                            </Button>
                        </div>
                        <div className="mb-2 flex flex-justify-space-between on-mobile-flex-column">
                            <div className={clsx(['flex-item-fluid', isNarrow ? 'pr-0' : 'pr-4'])}>
                                <Label className="advanced-search-label text-semibold" htmlFor="begin-date">{c('Label')
                                    .t`From`}</Label>
                                <DateInput
                                    placeholder={c('Placeholder').t`Start date`}
                                    id="begin-date"
                                    data-testid="advanced-search:start-date"
                                    value={model.startDate}
                                    onChange={async (startDate) => {
                                        if (!model.endDate || !startDate || isBefore(startDate, model.endDate)) {
                                            updateModel({ ...model, startDate });
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-item-fluid">
                                <Label className="advanced-search-label text-semibold" htmlFor="end-date">{c('Label')
                                    .t`To`}</Label>
                                <DateInput
                                    placeholder={c('Placeholder').t`End date`}
                                    id="end-date"
                                    data-testid="advanced-search:end-date"
                                    value={model.endDate}
                                    onChange={(endDate) =>
                                        (!model.startDate || !endDate || isAfter(endDate, model.startDate)) &&
                                        updateModel({ ...model, endDate })
                                    }
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="my-4 mx-5 flex flex-align-items-center flex-justify-space-between">
                {!showMore && !HIDE_SEARCH_FORM && (
                    <Button
                        data-testid="advanced-search:show-more"
                        className="mb-2 w-full md:w-auto"
                        onClick={toggleShowMore}
                        title={c('Action').t`Show more search options`}
                    >
                        {c('Action').t`More search options`}
                    </Button>
                )}
                <div className="ml-auto w-full md:w-auto">
                    {canReset ? (
                        <Button
                            data-testid="advanced-search:reset"
                            className="mb-2 w-full md:w-auto mr-4"
                            type="reset"
                            title={c('Action').t`Reset search form`}
                        >{c('Action').t`Reset`}</Button>
                    ) : null}
                    <PrimaryButton
                        data-testid="advanced-search:submit"
                        type="submit"
                        disabled={!model.keyword.trim()}
                        className="mb-2 w-full md:w-auto"
                        loading={loading}
                    >{c('Action').t`Search`}</PrimaryButton>
                </div>
            </div>
        </>
    );
};

export default CalendarSearchForm;
