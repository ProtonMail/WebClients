import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import { UNIX_DAY, UNIX_HOUR, UNIX_WEEK } from '@proton/pass/utils/time/constants';

export enum ExpireTime {
    OneHour = UNIX_HOUR,
    OneDay = UNIX_DAY,
    OneWeek = UNIX_WEEK,
    TwoWeeks = UNIX_WEEK * 2,
    OneMonth = UNIX_DAY * 30,
}

type Props = { disabled: boolean; value: ExpireTime; onChange: (value: ExpireTime) => void };
type ExpireTimeOption = { value: ExpireTime; title: string };

export const getExpireTimeOptions = (): ExpireTimeOption[] => [
    { value: ExpireTime.OneHour, title: c('Label').t`1 hour` },
    { value: ExpireTime.OneDay, title: c('Label').t`24 hours` },
    { value: ExpireTime.OneWeek, title: c('Label').t`7 days` },
    { value: ExpireTime.TwoWeeks, title: c('Label').t`14 days` },
    { value: ExpireTime.OneMonth, title: c('Label').t`30 days` },
];

export const ExpirationTimeSelect: FC<Props> = ({ disabled, value, onChange }) => {
    const expirationTimeOptions = useMemo(() => getExpireTimeOptions(), []);

    return (
        <InlineFieldBox label={c('Action').t`Link expires after`}>
            <SelectTwo
                className="bg-weak border-none"
                color="weak"
                value={value}
                onChange={({ value }) => onChange(value)}
                disabled={disabled}
            >
                {expirationTimeOptions.map(({ value, title }) => (
                    <Option key={title} value={value} title={title}>
                        {title}
                    </Option>
                ))}
            </SelectTwo>
        </InlineFieldBox>
    );
};
