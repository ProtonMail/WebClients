import { useState } from 'react';

const FOCUSSED_CLASS = 'focussed';
const BLURRED_CLASS = 'blured';
const DIRTY_CLASS = 'dirty';
const PRISTINE_CLASS = 'pristine';

const DEFAULT_STATE = { focussed: false, blurred: false, dirty: false, pristine: true };

const useInput = (initialState = DEFAULT_STATE, prefix = 'field') => {
    const [status, changeStatus] = useState(initialState);
    const change = () => !status.dirty && changeStatus({ ...status, dirty: true, pristine: false });
    const blur = () => !status.blurred && changeStatus({ ...status, blurred: true, pristine: false });
    const focus = () => !status.focussed && changeStatus({ ...status, focussed: true, pristine: false });
    const reset = () => changeStatus({ ...DEFAULT_STATE });
    const classes = [];

    if (status.pristine) {
        classes.push(PRISTINE_CLASS);
    } else {
        status.focussed && classes.push(`${prefix}-${FOCUSSED_CLASS}`);
        status.blurred && classes.push(`${prefix}-${BLURRED_CLASS}`);
        status.dirty && classes.push(`${prefix}-${DIRTY_CLASS}`);
    }

    return {
        status,
        statusClasses: classes.join(' '),
        change,
        blur,
        focus,
        reset
    };
};

export default useInput;
