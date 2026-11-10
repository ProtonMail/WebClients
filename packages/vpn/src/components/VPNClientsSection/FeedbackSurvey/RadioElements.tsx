import { Fragment, useState } from 'react';

import { c } from 'ttag';

import Radio from '@proton/components/components/input/Radio';
import Option, { type OptionProps } from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import { defaultFilterFunction } from '@proton/components/components/selectTwo/helpers';
import clsx from '@proton/utils/clsx';

import { normalizeSupplementaryValue } from './normalizeSupplementaryValue';
import type { SurveyOptions } from './surveyOptions';

// Match the normalized value too, so a search that `isCustomValue` rejects still lists its predefined option
const filterSubOption = (option: OptionProps<string>, keyword?: string) =>
    defaultFilterFunction(option, keyword) || option.value.includes(normalizeSupplementaryValue(keyword ?? ''));

export const RadioElements = ({
    onChangeRadio,
    radioValue,
    onChangeSupplementary,
    options,
    className,
    supplementaryInputs,
}: {
    onChangeRadio: (value: string) => void;
    onChangeSupplementary: (choice: string, value: string) => void;
    radioValue: string;
    supplementaryInputs: Record<string, string>;
    options: SurveyOptions;
    className?: string;
}) => {
    const [searchValue, setSearchValue] = useState('');

    const defaultMarginBottom = ['mb', 'my'].every((marginMatch) => !className?.includes(marginMatch)) ? 'mb-2' : '';
    const defaultMarginRight = ['mr', 'mx'].every((marginMatch) => !className?.includes(marginMatch)) ? 'mr-8' : '';

    const getSubOptionElements = (subOptions: { name: string; value: string }[], selectedValue: string) => {
        const tsxOptions = subOptions.map((subOption) => (
            <Option key={subOption.value} value={subOption.value} title={subOption.name}>
                {subOption.name}
            </Option>
        ));

        const isCustomValue = (value: string) => {
            const normalizedValue = normalizeSupplementaryValue(value);
            return !subOptions.some(
                (opt) => opt.value === normalizedValue || normalizeSupplementaryValue(opt.name) === normalizedValue
            );
        };

        const customValues = new Set(
            [selectedValue, searchValue].filter((value) => value.trim() && isCustomValue(value))
        );
        customValues.forEach((customValue) => {
            tsxOptions.push(
                <Option key={`custom-${customValue}`} title={customValue} value={customValue}>
                    {customValue}
                </Option>
            );
        });

        return tsxOptions;
    };

    return options.map((option, i) => (
        <Fragment key={option.value}>
            <Radio
                name="feedback-survey"
                id={`feedback-survey-radio_${i}`}
                onChange={() => {
                    onChangeRadio(option.value);
                }}
                checked={radioValue === option.value}
                className={clsx('inline-flex *:self-center', defaultMarginRight, defaultMarginBottom, className)}
                disabled={option.disabled}
            >
                {option.hint ? (
                    <span className="flex">
                        <span>{option.label}</span>
                        &nbsp;
                        <i className="color-hint">{option.hint}</i>
                    </span>
                ) : (
                    option.label
                )}
            </Radio>
            {option.options && option.options.length > 0 && radioValue === option.value ? (
                <SearchableSelect
                    key={`${option.value}-selector`}
                    caretClassName="hidden"
                    search={filterSubOption}
                    value={supplementaryInputs[option.value] || ''}
                    onChange={({ value }) => onChangeSupplementary(option.value, value)}
                    placeholder={c('Info').t`Please specify...`}
                    onSearchInputChange={setSearchValue}
                >
                    {getSubOptionElements(option.options, supplementaryInputs[option.value] || '')}
                </SearchableSelect>
            ) : undefined}
        </Fragment>
    ));
};
