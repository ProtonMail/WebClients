import { Input } from 'react-components';
import { MAX_LENGTHS } from '../../../constants';
import React from 'react';
import { c } from 'ttag';

const TitleInput = ({ onChange, type = 'event', isSubmitted, ...rest }) => {
    const PLACEHOLDER_TITLE = {
        event: c('Placeholder').t`Add an event title`,
        alarm: c('Placeholder').t`Add an alarm title`,
        task: c('Placeholder').t`Add a task title`
    };
    return (
        <Input
            placeholder={PLACEHOLDER_TITLE[type]}
            autoFocus={true}
            maxLength={MAX_LENGTHS.TITLE}
            onChange={({ target }) => onChange(target.value)}
            isSubmitted={isSubmitted}
            {...rest}
        />
    )
};

export default TitleInput;
