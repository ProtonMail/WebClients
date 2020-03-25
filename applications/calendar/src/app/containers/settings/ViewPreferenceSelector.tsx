import React from 'react';
import { c } from 'ttag';
import { SETTINGS_VIEW } from 'proton-shared/lib/interfaces/calendar';

interface Props {
    id: string;
    className?: string;
    loading: boolean;
    disabled?: boolean;
    view: SETTINGS_VIEW;
    onChange: (view: SETTINGS_VIEW) => void;
}
const ViewPreferenceSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    view,
    onChange,
    ...rest
}: Props) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: SETTINGS_VIEW.DAY },
        { text: c('Calendar view').t`Week`, value: SETTINGS_VIEW.WEEK },
        { text: c('Calendar view').t`Month`, value: SETTINGS_VIEW.MONTH }
        // not activated for beta
        //{ text: c('Calendar view').t`Year`, value: YEAR },
        //{ text: c('Calendar view').t`Agenda`, value: PLANNING },
    ].filter(Boolean);

    return (
        <select
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select calendar view`}
            value={view}
            onChange={({ target }) => onChange(+target.value)}
            {...rest}
        >
            {options.map(({ text, value }) => {
                return (
                    <option key={value} value={value}>
                        {text}
                    </option>
                );
            })}
        </select>
    );
};

export default ViewPreferenceSelector;
