import { FormEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Input } from '@proton/atoms/Input';
import { Block, DateInput, Icon, Option, SelectTwo } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';

import { FilterModel } from './PassEvents';
import { getEventNameText } from './helpers';

interface Props {
    filter: FilterModel;
    keyword: string;
    setKeyword: (keyword: string) => void;
    handleStartDateChange: (date: Date | undefined) => void;
    handleEndDateChange: (date: Date | undefined) => void;
    eventTypesList: string[] | [];
    handleSetEventType: (eventType: string) => void;
    handleSearchSubmit: () => void;
}

const FilterAndSortEventsBlock = ({
    filter,
    keyword,
    setKeyword,
    handleStartDateChange,
    handleEndDateChange,
    eventTypesList,
    handleSetEventType,
    handleSearchSubmit,
}: Props) => {
    const [submitting] = useLoading();

    const today = new Date();

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        handleSearchSubmit();
    };

    return (
        <Block>
            <form
                onSubmit={handleSubmit}
                className="flex flex-column md:flex-row gap-2 items-start items-center justify-space-between *:min-size-auto"
            >
                <Input
                    value={keyword}
                    placeholder={c('Placeholder').t`Email or IP`}
                    prefix={<Icon name="magnifier" />}
                    onValue={setKeyword}
                    className="w-full md:max-h-auto"
                />
                <SelectTwo id="eventType" value={filter.eventType} onValue={handleSetEventType} className="flex-1">
                    {eventTypesList.map((type) => {
                        return (
                            <Option key={type} value={type} title={type}>
                                {getEventNameText(type)}
                            </Option>
                        );
                    })}
                </SelectTwo>
                <DateInput
                    id="start"
                    placeholder={c('Placeholder').t`Start date`}
                    value={filter.start}
                    onChange={handleStartDateChange}
                    className="flex-1"
                    max={today}
                />
                <DateInput
                    id="end"
                    placeholder={c('Placeholder').t`End date`}
                    value={filter.end}
                    onChange={handleEndDateChange}
                    className="flex-1"
                    max={today}
                />
                <Button color="norm" type="submit" loading={submitting}>
                    {c('Action').t`Search`}
                </Button>
            </form>
        </Block>
    );
};

export default FilterAndSortEventsBlock;
