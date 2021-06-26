import React from 'react';
import { c } from 'ttag';

import { SETTINGS_VIEW } from '@proton/shared/lib/calendar/constants';

import { SelectTwo, Option } from '../../../components';

interface Props {
    id: string;
    className?: string;
    loading: boolean;
    disabled?: boolean;
    view: SETTINGS_VIEW;
    onChange: (view: SETTINGS_VIEW) => void;
}

const ViewPreferenceSelector = ({
    className = 'field w100',
    loading = false,
    disabled = false,
    view,
    onChange,
    ...rest
}: Props) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: SETTINGS_VIEW.DAY },
        { text: c('Calendar view').t`Week`, value: SETTINGS_VIEW.WEEK },
        { text: c('Calendar view').t`Month`, value: SETTINGS_VIEW.MONTH },
        // not activated for beta
        // { text: c('Calendar view').t`Year`, value: YEAR },
        // { text: c('Calendar view').t`Agenda`, value: PLANNING },
    ].filter(Boolean);

    return (
        <SelectTwo
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select calendar view`}
            value={view}
            onChange={({ value }) => onChange(+value)}
            {...rest}
        >
            {options.map(({ text, value }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

export default ViewPreferenceSelector;
