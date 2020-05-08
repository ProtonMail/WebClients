import React from 'react';
import { classnames, Icon, Loader } from 'react-components';

interface Props {
    id: string;
    display: string;
    value: number;
    max?: number;
    loading: boolean;
    success?: boolean;
    partialSuccess?: boolean;
}
const DynamicProgress = ({
    id,
    display,
    value,
    max = 100,
    loading,
    success = true,
    partialSuccess,
    ...rest
}: Props) => {
    const { icon, progressClassname } = loading
        ? {
              icon: <Loader />,
              progressClassname: 'progress-contact'
          }
        : success
        ? {
              icon: (
                  <span className="inline-flex bg-global-success rounded50 p0-5">
                      <Icon name="on" color="white" size={24} />
                  </span>
              ),
              progressClassname: 'progress-contact progress-contact--success'
          }
        : partialSuccess
        ? {
              icon: (
                  <span className="inline-flex bg-global-attention rounded50 p0-5">
                      <Icon name="off" color="white" size={24} />
                  </span>
              ),
              progressClassname: 'progress-contact progress-contact--warning'
          }
        : {
              icon: (
                  <span className="inline-flex bg-global-warning rounded50 p0-5">
                      <Icon name="off" color="white" size={24} />
                  </span>
              ),
              progressClassname: 'progress-contact progress-contact--error'
          };

    return (
        <div className="aligncenter">
            {icon}
            <progress
                className={classnames(['w100 mt1', progressClassname])}
                aria-describedby={id}
                value={value}
                max={max}
                {...rest}
            />
            <p aria-atomic="true" aria-live="polite" id={id}>
                {display}
            </p>
        </div>
    );
};

export default DynamicProgress;
