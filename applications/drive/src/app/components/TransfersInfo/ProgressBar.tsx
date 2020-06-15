import React from 'react';
import { classnames, Progress } from 'react-components';

export enum ProgressBarStatus {
    Disabled = 'disabled',
    Running = 'running',
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
    <Progress className={classnames(['pd-transfers-listItem-progress is-thin', `progressbar--${status}`])} {...rest} />
);

export default ProgressBar;
