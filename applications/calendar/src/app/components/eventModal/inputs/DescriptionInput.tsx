import React from 'react';
import { TextArea } from 'react-components';
import { c } from 'ttag';

import { MAX_LENGTHS } from '../../../constants';

export interface Props {
    id?: string;
    value: string;
    onChange: (value: string) => void;
}

const DescriptionInput = ({ onChange, ...rest }: Props) => {
    return (
        <TextArea
            minRows={2}
            autoGrow={true}
            placeholder={c('Placeholder').t`Add a description`}
            onChange={({ target }: React.ChangeEvent<HTMLTextAreaElement>) => onChange(target.value)}
            maxLength={MAX_LENGTHS.EVENT_DESCRIPTION}
            {...rest}
        />
    );
};

export default DescriptionInput;
