import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';

import { c } from 'ttag';

import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import clsx from '@proton/utils/clsx';

import { useStaticSurveyOptions } from './useStaticSurveyOptions';

export const RadioElements = ({
    onChangeRadio,
    radioValue,
    onChangeSupplementary,
    supplementaryInputs,
    options,
    className,
}: {
    onChangeRadio: (value: string) => void;
    onChangeSupplementary: (choice: string, value: string) => void;
    radioValue: string;
    supplementaryInputs: Record<string, string>;
    options: {
        value: string;
        label: ReactNode;
        disabled?: boolean;
    }[];
    className?: string;
}) => {
    const { podcasts, youtubeChannels } = useStaticSurveyOptions();
    const [searchValue, setSearchValue] = useState('');

    // If we dont have marginBottom or vertical margin in className, let's add default one
    const defaultMarginBottom = ['mb', 'my'].every((marginMatch) => !className?.includes(marginMatch)) ? 'mb-2' : '';
    // If we dont have marginRight or horizontal margin in className, let's add default one
    const defaultMarginRight = ['mr', 'mx'].every((marginMatch) => !className?.includes(marginMatch)) ? 'mr-8' : '';

    const podcastOptions = [
        ...podcasts,
        ...(searchValue
            ? [<Option key={searchValue} title={searchValue} value={searchValue.toLowerCase().replace(/\s+/g, '_')} />]
            : []),
    ];

    const youtubeOptions = [
        ...youtubeChannels,
        ...(searchValue
            ? [<Option key={searchValue} title={searchValue} value={searchValue.toLowerCase().replace(/\s+/g, '_')} />]
            : []),
    ];

    return options.map((option, i) => (
        <Fragment key={option.value}>
            <Radio
                name="feedback-survey"
                id={`${name}-radio_${i}`}
                onChange={() => {
                    onChangeRadio(option.value);
                }}
                checked={radioValue === option.value}
                className={clsx('inline-flex *:self-center', defaultMarginRight, defaultMarginBottom, className)}
                disabled={option.disabled}
            >
                {option.label}
            </Radio>
            {option.value === 'Podcast' && radioValue === 'Podcast' ? (
                <SearchableSelect
                    key="podcast-selector"
                    caretClassName="hidden"
                    search
                    value={supplementaryInputs.Podcast || ''}
                    onChange={({ value }) => onChangeSupplementary('Podcast', value)}
                    placeholder={c('Info').t`Please specify...`}
                    onSearchInputChange={setSearchValue}
                >
                    {podcastOptions}
                </SearchableSelect>
            ) : undefined}

            {option.value === 'YouTube' && radioValue === 'YouTube' ? (
                <SearchableSelect
                    key="youtube-selector"
                    caretClassName="hidden"
                    search
                    value={supplementaryInputs.YouTube || ''}
                    onChange={({ value }) => onChangeSupplementary('YouTube', value)}
                    placeholder={c('Info').t`Please specify...`}
                    onSearchInputChange={setSearchValue}
                >
                    {youtubeOptions}
                </SearchableSelect>
            ) : undefined}
        </Fragment>
    ));
};
