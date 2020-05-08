import React from 'react';
import { c } from 'ttag';
import { Details, Summary, Bordered } from 'react-components';
import { DetailError } from '../../interfaces/Import';

interface Props {
    summary?: string;
    errors: DetailError[];
}

const ErrorDetails = ({ errors, summary = c('Info on errors').t`Click for details` }: Props) => {
    if (!errors.length) {
        return null;
    }
    return (
        <Details>
            <Summary>{summary}</Summary>
            <Bordered>
                {errors
                    .sort(({ index: index1 }, { index: index2 }) => index1 - index2)
                    .map(({ index, message }) => (
                        <div key={index}>{message}</div>
                    ))}
            </Bordered>
        </Details>
    );
};

export default ErrorDetails;
