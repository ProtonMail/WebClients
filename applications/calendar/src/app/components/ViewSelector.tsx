import React from 'react';
import { classnames } from '@proton/components';
import { c } from 'ttag';

import { VIEWS } from '@proton/shared/lib/calendar/constants';

const { DAY, WEEK, MONTH, CUSTOM } = VIEWS;

interface Props {
    range: number;
    loading?: boolean;
    disabled?: boolean;
    view: VIEWS;
    onChange: (value: VIEWS) => void;
}
const ViewSelector = ({ range, loading = false, disabled = false, view, onChange, ...rest }: Props) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH },
        // { text: c('Calendar view').t`Year`, value: YEAR },
        // { text: c('Calendar view').t`Agenda`, value: AGENDA },
    ];

    return (
        <>
            {options.map(({ text, value }) => {
                const v = range ? CUSTOM : value;
                return (
                    <button
                        key={value}
                        type="button"
                        disabled={loading || disabled}
                        className={classnames(['toolbar-button color-inherit', v === view && 'is-active'])}
                        aria-pressed={v === view ? true : undefined}
                        onClick={() => onChange(value)}
                        {...rest}
                    >
                        <span className="mauto">{text}</span>
                    </button>
                );
            })}
        </>
    );
};

export default ViewSelector;
