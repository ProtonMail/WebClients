import React from 'react';
import { classnames } from 'react-components';

export enum ProgressBarStatus {
    Success = 'success',
    Warning = 'warning',
    Error = 'error'
}

interface Props extends React.ProgressHTMLAttributes<HTMLProgressElement> {
    status?: ProgressBarStatus;
}

const ProgressBar = ({ status = ProgressBarStatus.Success, ...rest }: Props) => (
    <progress className={classnames(['progress-contact w100 mt1', `progress-contact--${status}`])} {...rest} />
);

export default ProgressBar;
