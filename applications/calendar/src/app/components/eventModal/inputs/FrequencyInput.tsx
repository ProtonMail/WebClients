import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownButton,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components';
import type { SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import { END_TYPE, FREQUENCY, type MONTHLY_TYPE, WEEKLY_TYPE } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getFormattedWeekdays, getWeekday, isWeekday } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import useMonthlyOptions from './useMonthlyOptions';

const { ONCE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM } = FREQUENCY;

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
    <span className="pr-4 color-weak text-sm">{descriptionText}</span>
);

interface Props extends Omit<SelectTwoProps<string>, 'onChange' | 'children'> {
    start: DateTimeModel;
    weekStartsOn: WeekStartsOn;
    frequencyModel: FrequencyModel;
    onChange: (frequencyModel: FrequencyModel) => void;
}

const FrequencyInput = ({ start, weekStartsOn, frequencyModel, onChange, className, ...rest }: Props) => {
    const weekdaysLong = useMemo(() => getFormattedWeekdays('cccc', { locale: dateLocale }), [dateLocale]);

    const currentDay = start.date.getDay();
    const options = useMonthlyOptions(start.date);

    const monthlyOptions = options.map((option) => {
        const description = OptionDescription(option.text);
        return {
            text: c('Option').jt`Every month ${description}`,
            title: c('Title').t`Every month ${option.text}`,
            type: MONTHLY,
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
            type: ONCE,
            value: ONCE,
            shouldDisplay: true,
        },
        {
            text: c('Option').t`Every day`,
            title: c('Title').t`Every day`,
            type: DAILY,
            value: DAILY,
            shouldDisplay: true,
        },
        {
            text: c('Option').jt`Every weekday ${everyWeekdayDescription}`,
            title: c('Title').t`Every weekday ${startOfTheWeekDay} - ${endOfTheWeekDay}`,
            type: WEEKLY,
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
            type: WEEKLY,
            value: WEEKLY,
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
            type: YEARLY,
            value: YEARLY,
            shouldDisplay: true,
        },
        {
            text: c('Option').t`Custom...`,
            title: c('Option').t`Custom...`,
            type: CUSTOM,
            value: CUSTOM,
            shouldDisplay: true,
        },
    ];

    const validateWeeklyDays = (option: FrequencyOption, frequencyModel: FrequencyModel) => {
        return option.weekly?.days.sort().toString() === frequencyModel.weekly.days.sort().toString();
    };

    const getInitialSelection = () => {
        const isDefault = frequencyModel.type === ONCE;
        const isCustom = frequencyModel.type === CUSTOM;
        const isWeekly = frequencyModel.frequency === WEEKLY;
        const isMonthly = frequencyModel.frequency === MONTHLY;

        if (isDefault) {
            return frequencies[0];
        }

        const customOption = frequencies.find((option) => option.type === CUSTOM);

        if (isCustom) {
            let option = undefined;

            if (frequencyModel.interval === 1 && frequencyModel.ends.type === END_TYPE.NEVER) {
                if (isWeekly) {
                    option = frequencies.find(
                        (option) =>
                            option.type === WEEKLY &&
                            option.weekly?.type === frequencyModel.weekly.type &&
                            validateWeeklyDays(option, frequencyModel)
                    );
                }

                if (isMonthly) {
                    option = frequencies.find(
                        (option) => option.type === MONTHLY && option.monthly?.type === frequencyModel.monthly.type
                    );
                }
            }
            return option || customOption || frequencies[0];
        }

        if (isWeekly) {
            return (
                frequencies.find(
                    (option) =>
                        option.type === WEEKLY &&
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
                    (option) => option.type === MONTHLY && option.monthly?.type === frequencyModel.monthly.type
                ) ||
                customOption ||
                frequencies[0]
            );
        }

        return frequencies.find((option) => option.type === frequencyModel.type) || frequencies[0];
    };

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [selectedOption, setSelectedOption] = useState(getInitialSelection);

    useEffect(() => {
        setSelectedOption(getInitialSelection);
    }, [start]);

    const filteredFrequencies = frequencies.filter(({ shouldDisplay }) => shouldDisplay);

    const handleClick = () => {
        toggle();
    };

    const selectedOptionTitle = selectedOption.value === CUSTOM ? c('Option').t`Custom` : selectedOption.title;

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
                <Icon className="shrink-0" name="arrows-rotate" />
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
                        <>
                            {type === CUSTOM && <hr className="my-2" />}
                            <DropdownMenuButton
                                className={clsx('text-left flex flex-nowrap items-center', type === CUSTOM && 'mb-1')}
                                onClick={() => {
                                    const frequencyOption = filteredFrequencies.find(
                                        (option) => option.value === value
                                    );
                                    if (!!frequencyOption) {
                                        onChange({
                                            ...frequencyModel,
                                            type: frequencyOption.type,
                                            frequency:
                                                frequencyOption.type !== CUSTOM
                                                    ? frequencyOption.type
                                                    : frequencyModel.frequency,
                                            monthly: frequencyOption.monthly ?? frequencyModel.monthly,
                                            weekly: frequencyOption.weekly ?? frequencyModel.weekly,
                                            ends:
                                                frequencyOption.type !== CUSTOM
                                                    ? { type: END_TYPE.NEVER, count: 2 }
                                                    : frequencyModel.ends,
                                            interval: frequencyOption.type !== CUSTOM ? 1 : frequencyModel.interval,
                                        });
                                        setSelectedOption(frequencyOption);
                                    }
                                }}
                                aria-pressed={selectedOption.title === title}
                                key={title}
                            >
                                <span className="pr-1">{text}</span>
                                {selectedOption.title === title && (
                                    <span className="ml-auto flex color-primary">
                                        <Icon name="checkmark" />
                                    </span>
                                )}
                            </DropdownMenuButton>
                        </>
                    );
                })}
            </Dropdown>
        </>
    );
};

export default FrequencyInput;
