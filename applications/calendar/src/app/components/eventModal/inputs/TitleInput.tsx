import { Input } from 'react-components';
import { Props as InputProps } from 'react-components/components/input/Input';
import { MAX_LENGTHS } from '../../../constants';
import React from 'react';
import { c } from 'ttag';

export interface Props extends Omit<InputProps, 'onChange'> {
    onChange: (value: string) => void;
    type: 'event' | 'alarm' | 'task';
}

const TitleInput = ({ onChange, type = 'event', ...rest }: Props) => {
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
            {...rest}
        />
    );
};

export default TitleInput;
