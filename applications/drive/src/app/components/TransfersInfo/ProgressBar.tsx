import React from 'react';
import { classnames, Progress } from 'react-components';

export enum ProgressBarStatus {
    Success = 'success',
    Warning = 'warning',
    Error = 'error'
}

interface Props {
    status?: ProgressBarStatus;
    value?: number;
    max?: number;
}

const ProgressBar = ({ status = ProgressBarStatus.Success, ...rest }: Props) => (
    <Progress className={classnames(['mt1', `progressbar--${status}`])} {...rest} />
);

export default ProgressBar;
