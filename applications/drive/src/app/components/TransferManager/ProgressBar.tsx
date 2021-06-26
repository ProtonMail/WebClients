import React from 'react';
import { classnames, Progress } from '@proton/components';

export enum ProgressBarStatus {
    Disabled = 'disabled',
    Running = 'running',
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

interface Props {
    status?: ProgressBarStatus;
    value?: number;
    max?: number;
}

const ProgressBar = ({ status = ProgressBarStatus.Success, ...rest }: Props) => (
    <Progress
        className={classnames(['transfers-manager-list-item-progress is-thin', `progress-bar--${status}`])}
        {...rest}
    />
);

export default ProgressBar;
