import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { AutoReplyDuration } from '@proton/shared/lib/constants';

import Select from '../../../../components/select/Select';
import { SettingsSelectRow } from '../../../account/SettingsSelectRow';
import { getDurationOptions } from '../../utils';

interface Props {
    value?: number;
    onChange: (duration: number) => void;
}

const getDurationDescription = (duration?: AutoReplyDuration) => {
    switch (duration) {
        case AutoReplyDuration.FIXED:
            return c('Info').t`Auto-reply is active from the start time to the end time.`;
        case AutoReplyDuration.DAILY:
            return c('Info')
                .t`Auto-reply is always active on the days of the week you select, between the selected hours.`;
        case AutoReplyDuration.WEEKLY:
            return c('Info').t`Auto-reply is active each week between the selected start and end time.`;
        case AutoReplyDuration.MONTHLY:
            return c('Info').t`Auto-reply is active each month between the selected start and end time.`;
        case AutoReplyDuration.PERMANENT:
            return c('Info').t`Auto-reply is active until you turn it off.`;
        default:
            return null;
    }
};

const DurationField = ({ value, onChange }: Props) => {
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value);

    const description = getDurationDescription(value);

    return (
        <SettingsSelectRow
            id="duration"
            label={
                <>
                    <SettingsSelectRow.Label>{c('Label').t`Duration`}</SettingsSelectRow.Label>
                    {description && <SettingsSelectRow.Description>{description}</SettingsSelectRow.Description>}
                </>
            }
            select={<Select id="duration" value={value} onChange={handleChange} options={getDurationOptions()} />}
        />
    );
};

export default DurationField;
