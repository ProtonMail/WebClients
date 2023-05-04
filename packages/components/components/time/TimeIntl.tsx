import { HTMLAttributes } from 'react';

import { OptionsWithIntl, readableTimeIntl } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

const getValue = (value?: string | number | null) => {
    if (typeof value === 'string') {
        const numberValue = parseInt(value, 10);
        if (!Number.isNaN(numberValue)) {
            return numberValue;
        }
    }

    if (typeof value === 'number') {
        return value;
    }

    return 0;
};

interface Props extends HTMLAttributes<HTMLTimeElement> {
    children?: string | number | null;
    localeCode?: string;
    sameDayOptions?: OptionsWithIntl['sameDayIntlOptions'];
    options?: OptionsWithIntl['intlOptions'];
}

const TimeIntl = ({ children, sameDayOptions, options, ...rest }: Props) => {
    return (
        <time {...rest}>
            {readableTimeIntl(getValue(children), {
                localeCode: dateLocale.code,
                sameDayIntlOptions: sameDayOptions,
                intlOptions: options,
            })}
        </time>
    );
};

export default TimeIntl;
