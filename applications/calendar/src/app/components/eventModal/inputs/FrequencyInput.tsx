import React, { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { END_TYPE, FREQUENCY, type MONTHLY_TYPE, WEEKLY_TYPE } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getFormattedWeekdays, getWeekday, isWeekday } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import useMonthlyOptions from './useMonthlyOptions';

interface FrequencyOption {
    text: ReactNode;
    title: string;
    desc?: string;
    type: FREQUENCY;
    value: string;
    shouldDisplay: boolean;
    monthly?: { type: MONTHLY_TYPE };
    weekly?: { type: WEEKLY_TYPE; days: number[] };
}

const OptionDescription = (descriptionText: string) => (
    <span key={descriptionText} className="pr-4 color-weak text-sm">
        {descriptionText}
    </span>
);

interface Props extends Omit<SelectTwoProps<string>, 'onChange' | 'children'> {
    start: DateTimeModel;
    weekStartsOn: WeekStartsOn;
    frequencyModel: FrequencyModel;
    onChange: (frequencyModel: FrequencyModel) => void;
}

const FrequencyInput = ({ start, weekStartsOn, frequencyModel, onChange, className, ...rest }: Props) => {
    const weekdaysLong = useMemo(() => getFormattedWeekdays('cccc', { locale: dateLocale }), []);

    const currentDay = start.date.getDay();
    const options = useMonthlyOptions(start.date);

    const monthlyOptions = options.map((option) => {
        const description = OptionDescription(option.text);
        return {
            text: c('Option').jt`Every month ${description}`,
            title: c('Title').t`Every month ${option.text}`,
            type: FREQUENCY.MONTHLY,
            value: `MONTHLY ${option.value}`,
            monthly: { type: option.value },
            shouldDisplay: true,
        };
    });

    const startOfTheWeekDay = weekdaysLong[weekStartsOn];
    const endOfTheWeekDay = weekdaysLong[getWeekday(weekStartsOn, 4)];

    const everyWeekdayDescription = OptionDescription(`${startOfTheWeekDay} - ${endOfTheWeekDay}`);
    const everyWeekDescription = OptionDescription(`on ${weekdaysLong[currentDay]}`);

    const frequencies: FrequencyOption[] = [
        {
            text: c('Option').t`Does not repeat`,
            title: c('Title').t`Does not repeat`,
            type: FREQUENCY.ONCE,
            value: FREQUENCY.ONCE,
            shouldDisplay: true,
        },
        {
            text: c('Option').t`Every day`,
            title: c('Title').t`Every day`,
            type: FREQUENCY.DAILY,
            value: FREQUENCY.DAILY,
            shouldDisplay: true,
        },
        {
            text: c('Option').jt`Every weekday ${everyWeekdayDescription}`,
            title: c('Title').t`Every weekday ${startOfTheWeekDay} - ${endOfTheWeekDay}`,
            type: FREQUENCY.WEEKLY,
            value: `WEEKLY ${WEEKLY_TYPE.ON_DAYS}`,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: Array.from({ length: 5 }, (_, i) => getWeekday(weekStartsOn, i)),
            },
            shouldDisplay: isWeekday(start.date, weekStartsOn),
        },
        {
            text: c('Option').jt`Every week ${everyWeekDescription}`,
            title: c('Title').t`Every week on ${weekdaysLong[currentDay]}`,
            type: FREQUENCY.WEEKLY,
            value: FREQUENCY.WEEKLY,
            shouldDisplay: true,
            weekly: {
                type: WEEKLY_TYPE.ON_DAYS,
                days: [currentDay],
            },
        },
        ...monthlyOptions,
        {
            text: c('Option').t`Every year`,
            title: c('Title').t`Every year`,
            type: FREQUENCY.YEARLY,
            value: FREQUENCY.YEARLY,
            shouldDisplay: true,
        },
        {
            text: c('Option').t`Custom...`,
            title: c('Option').t`Custom...`,
            type: FREQUENCY.CUSTOM,
            value: FREQUENCY.CUSTOM,
            shouldDisplay: true,
        },
    ];

    const validateWeeklyDays = (option: FrequencyOption, frequencyModel: FrequencyModel) => {
        return option.weekly?.days.sort().toString() === frequencyModel.weekly.days.sort().toString();
    };

    const getSelectedFrequency = () => {
        const isDefault = frequencyModel.type === FREQUENCY.ONCE;
        const isCustom = frequencyModel.type === FREQUENCY.CUSTOM;
        const isDaily = frequencyModel.frequency === FREQUENCY.DAILY;
        const isYearly = frequencyModel.frequency === FREQUENCY.YEARLY;
        const isWeekly = frequencyModel.frequency === FREQUENCY.WEEKLY;
        const isMonthly = frequencyModel.frequency === FREQUENCY.MONTHLY;

        if (isDefault) {
            return frequencies[0];
        }

        const customOption = frequencies.find((option) => option.type === FREQUENCY.CUSTOM);

        if (isCustom) {
            let option = undefined;

            if (frequencyModel.interval === 1 && frequencyModel.ends.type === END_TYPE.NEVER) {
                if (isWeekly) {
                    option = frequencies.find(
                        (option) =>
                            option.type === FREQUENCY.WEEKLY &&
                            option.weekly?.type === frequencyModel.weekly.type &&
                            validateWeeklyDays(option, frequencyModel)
                    );
                }

                if (isMonthly) {
                    option = frequencies.find(
                        (option) =>
                            option.type === FREQUENCY.MONTHLY && option.monthly?.type === frequencyModel.monthly.type
                    );
                }

                if (isDaily || isYearly) {
                    option = frequencies.find((option) => option.type === frequencyModel.frequency);
                }
            }
            return option || customOption || frequencies[0];
        }

        if (isWeekly) {
            return (
                frequencies.find(
                    (option) =>
                        option.type === FREQUENCY.WEEKLY &&
                        option.weekly?.type === frequencyModel.weekly.type &&
                        validateWeeklyDays(option, frequencyModel)
                ) ||
                customOption ||
                frequencies[0]
            );
        }

        if (isMonthly) {
            return (
                frequencies.find(
                    (option) =>
                        option.type === FREQUENCY.MONTHLY && option.monthly?.type === frequencyModel.monthly.type
                ) ||
                customOption ||
                frequencies[0]
            );
        }

        return frequencies.find((option) => option.type === frequencyModel.type) || frequencies[0];
    };

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const filteredFrequencies = frequencies.filter(({ shouldDisplay }) => shouldDisplay);

    const handleClick = () => {
        toggle();
    };

    const selectedFrequency = getSelectedFrequency();
    const selectedOptionTitle =
        selectedFrequency.value === FREQUENCY.CUSTOM ? c('Option').t`Custom` : selectedFrequency.title;

    return (
        <>
            <DropdownButton
                as="button"
                type="button"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={handleClick}
                className={clsx('rounded-md border py-1 px-2 text-sm gap-2', className)}
                style={{
                    borderColor: 'var(--interaction-weak-major-3)',
                    backgroundColor: isOpen ? 'var(--interaction-weak-minor-1)' : undefined,
                }}
                {...rest}
            >
                <IcArrowsRotate className="shrink-0" />
                <span className="p-0 text-ellipsis" title={selectedOptionTitle}>
                    {selectedOptionTitle}
                </span>
            </DropdownButton>
            <Dropdown
                autoClose
                autoCloseOutside
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-end"
                className="w-custom"
                size={{
                    width: DropdownSizeUnit.Dynamic,
                    maxWidth: '18rem',
                }}
            >
                <div className="text-left text-sm text-bold text-norm mt-3 mb-1 ml-4">Repeat event</div>
                {filteredFrequencies.map(({ type, value, title, text }) => {
                    return (
                        <React.Fragment key={title}>
                            {type === FREQUENCY.CUSTOM && <hr className="my-2" />}
                            <DropdownMenuButton
                                className={clsx(
                                    'text-left flex flex-nowrap items-center',
                                    type === FREQUENCY.CUSTOM && 'mb-1'
                                )}
                                onClick={() => {
                                    const frequencyOption = filteredFrequencies.find(
                                        (option) => option.value === value
                                    );
                                    if (!!frequencyOption) {
                                        onChange({
                                            ...frequencyModel,
                                            type: frequencyOption.type,
                                            frequency:
                                                frequencyOption.type !== FREQUENCY.CUSTOM
                                                    ? frequencyOption.type
                                                    : frequencyModel.frequency,
                                            monthly: frequencyOption.monthly ?? frequencyModel.monthly,
                                            weekly: frequencyOption.weekly ?? frequencyModel.weekly,
                                            ends:
                                                frequencyOption.type !== FREQUENCY.CUSTOM
                                                    ? { type: END_TYPE.NEVER, count: 2 }
                                                    : frequencyModel.ends,
                                            interval:
                                                frequencyOption.type !== FREQUENCY.CUSTOM ? 1 : frequencyModel.interval,
                                        });
                                    }
                                }}
                                aria-pressed={selectedFrequency.title === title}
                                key={title}
                            >
                                <span className="pr-1">{text}</span>
                                {selectedFrequency.title === title && (
                                    <span className="ml-auto flex color-primary">
                                        <IcCheckmark />
                                    </span>
                                )}
                            </DropdownMenuButton>
                        </React.Fragment>
                    );
                })}
            </Dropdown>
        </>
    );
};

export default FrequencyInput;
