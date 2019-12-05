import React from 'react';
import { Checkbox } from 'react-components';
import { c } from 'ttag';

const AllDayCheckbox = ({ checked, onChange }) => {
    return (
        <Checkbox id="event-allday-checkbox" checked={checked} onChange={({ target }) => onChange(target.checked)}>
            {c('Label').t`All day`}
        </Checkbox>
    );
};

export default AllDayCheckbox;
