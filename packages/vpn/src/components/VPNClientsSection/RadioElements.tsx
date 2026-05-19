import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';

import { c } from 'ttag';

import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import clsx from '@proton/utils/clsx';

import { usePodcasts } from './usePodcasts';

export const RadioElements = ({
    onChangeRadio,
    radioValue,
    onChangePodcast,
    podcastValue,
    options,
    className,
}: {
    onChangeRadio: (value: string) => void;
    onChangePodcast: (value: string) => void;
    radioValue: string;
    podcastValue: string;
    options: {
        value: string;
        label: ReactNode;
        disabled?: boolean;
    }[];
    className?: string;
}) => {
    const { podcasts } = usePodcasts();
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
                    value={podcastValue}
                    onChange={({ value }) => onChangePodcast(value)}
                    placeholder={c('Info').t`Please specify...`}
                    onSearchInputChange={setSearchValue}
                >
                    {podcastOptions}
                </SearchableSelect>
            ) : undefined}
        </Fragment>
    ));
};
