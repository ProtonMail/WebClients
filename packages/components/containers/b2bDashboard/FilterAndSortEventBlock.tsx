import { type FormEvent } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import DateInput from '@proton/components/components/input/DateInput';
import Label from '@proton/components/components/label/Label';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
import clsx from '@proton/utils/clsx';

import type { FilterModel } from './VPN/VPNEvents';

interface Event {
    EventType: string;
    EventTypeName: string;
}

interface Event {
    EventType: string;
    EventTypeName: string;
}

interface Props {
    filter: FilterModel;
    keyword: string;
    setKeyword: (keyword: string) => void;
    handleStartDateChange: (date: Date | undefined) => void;
    handleEndDateChange: (date: Date | undefined) => void;
    eventTypesList: Event[];
    handleSetEventType: (eventType: string) => void;
    handleDownloadClick: () => void;
    handleSearchSubmit: () => void;
    hasFilterEvents?: boolean;
    hasRefreshEvents?: boolean;
    loadingReload?: boolean;
    isOrganizationEvents?: boolean;
    onReload?: () => void;
    resetFilter: () => void;
}

export const FilterAndSortEventsBlock = ({
    filter,
    keyword,
    setKeyword,
    handleStartDateChange,
    handleEndDateChange,
    eventTypesList,
    handleSetEventType,
    handleDownloadClick,
    handleSearchSubmit,
    hasFilterEvents,
    hasRefreshEvents,
    loadingReload,
    isOrganizationEvents,
    onReload,
    resetFilter,
}: Props) => {
    const [submitting] = useLoading();

    const today = new Date();

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        handleSearchSubmit();
    };

    const { viewportWidth } = useActiveBreakpoint();

    const isFilterEmpty = () => {
        return (
            (filter.eventType === '' || filter.eventType === 'All Events') &&
            filter.start === undefined &&
            filter.end === undefined
        );
    };

    return (
        <div className="flex flex-row justify-space-between">
            <div className="w-full">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-column md:flex-row gap-2 justify-between"
                >
                    <div className="flex flex-column md:flex-row gap-2 *:min-size-auto">
                        <div className="flex flex-column *:min-size-auto w-full leading-10 mb-2 w-custom" style={{ '--w-custom': '16rem' }}>
                            <Label className="text-semibold p-0 h-6 mb-1" htmlFor="search">
                                {c('Label').t`Search`}
                            </Label>
                            <Input
                                value={keyword}
                                placeholder={isOrganizationEvents ? c('Placeholder').t`Search users or details` : c('Placeholder').t`Search for an email or IP address`}
                                prefix={<Icon name="magnifier" />}
                                onValue={setKeyword}
                                className="md:max-h-auto"
                                data-protonpass-ignore="true"
                            />
                        </div>
                        {hasFilterEvents && (
                            <div className="flex flex-column leading-10 mb-2 w-custom" style={{ '--w-custom': '10rem' }}>
                                <Label className="text-semibold p-0 h-6 mb-1" htmlFor="search">
                                    {c('Label').t`Event`}
                                </Label>
                                <SelectTwo
                                    id="eventType"
                                    value={filter.eventType}
                                    onValue={handleSetEventType}
                                    className="w-full"
                                >
                                    {eventTypesList.map((event) => {
                                        return (
                                            <Option
                                                key={event.EventType}
                                                value={event.EventType}
                                                title={event.EventTypeName}
                                            >
                                                {event.EventTypeName}
                                            </Option>
                                        );
                                    })}
                                </SelectTwo>
                            </div>
                        )}
                        <div
                            className={clsx([
                                'mb-2 md:flex-1 md:max-w-1/2 flex flex-column justify-space-between sm:flex-row gap-2',
                                viewportWidth['<=small'] && '*:min-size-auto flex-nowrap',
                            ])}
                        >
                            <div className="flex-1 flex flex-column *:min-size-auto leading-10 w-custom" style={{ '--w-custom': '8rem' }}>
                                <Label className="text-semibold p-0 h-6 mb-1" htmlFor="begin-date">
                                    {c('Label (begin date/advanced search)').t`From`}
                                </Label>
                                <DateInput
                                    id="start"
                                    placeholder={c('Placeholder').t`Start date`}
                                    value={filter.start}
                                    onChange={handleStartDateChange}
                                    className="flex-1"
                                    max={today}
                                />
                            </div>
                            <span
                                className="hidden sm:flex text-bold self-end h-custom shrink-0"
                                style={{ '--h-custom': '1.75rem' }}
                            >
                                -
                            </span>
                            <div className="flex-1 flex flex-column *:min-size-auto leading-10 w-custom" style={{ '--w-custom': '8rem' }}>
                                <Label className="text-semibold p-0 h-6 mb-1" htmlFor="end-date">
                                    {c('Label (end date/advanced search)').t`To`}
                                </Label>
                                <DateInput
                                    id="end"
                                    placeholder={c('Placeholder').t`End date`}
                                    value={filter.end}
                                    onChange={handleEndDateChange}
                                    className="flex-1"
                                    max={today}
                                />
                            </div>
                        </div>
                        <div className="flex mt-auto mb-2">
                            <Button color="norm" type="submit" loading={submitting} className="self-end">
                                {c('Action').t`Search`}
                            </Button>
                        </div>
                        <div className="flex mt-auto mb-2">
                            {!isFilterEmpty() && (
                                <Button
                                    color="norm"
                                    shape="ghost"
                                    type="submit"
                                    loading={submitting}
                                    className="self-end"
                                    onClick={resetFilter}
                                >
                                    {c('Action').t`Reset`}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="mb-2 md:flex-1 flex lg:inline-flex flex-nowrap flex-row gap-2 leading-10 shrink-0 justify-end">
                        <div
                            className="flex flex-row flex-nowrap mt-auto justify-end h-custom"
                            style={{ '--h-custom': '2.25rem' }}
                        >
                            {hasRefreshEvents && (
                                <Button
                                    shape="outline"
                                    className="self-end"
                                    loading={loadingReload}
                                    onClick={onReload}
                                    title={c('Action').t`Refresh`}
                                >
                                    <Icon name="arrow-rotate-right" className="mr-2" />
                                    {c('Action').t`Refresh`}
                                </Button>
                            )}
                            <Button
                                shape="outline"
                                className="self-end ml-2"
                                onClick={handleDownloadClick}
                                title={c('Action').t`Export`}
                            >
                                <Icon name="arrow-down-line" className="mr-2" />
                                {c('Action').t`Export`}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
