import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import clsx from '@proton/utils/clsx';

import Progress from './Progress';

interface Props {
    id: string;
    display?: string;
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
    const { icon, progressClassname = '' } = loading
        ? {
              icon: <Loader />,
          }
        : success
          ? {
                icon: (
                    <span className="inline-flex bg-success rounded-50 p-2">
                        <Icon name="checkmark" size={6} />
                    </span>
                ),
                progressClassname: 'progress-bar--success',
            }
          : partialSuccess
            ? {
                  icon: (
                      <span className="inline-flex bg-warning rounded-50 p-2">
                          <Icon name="cross" size={6} />
                      </span>
                  ),
                  progressClassname: 'progress-bar--warning',
              }
            : {
                  icon: (
                      <span className="inline-flex bg-danger rounded-50 p-2">
                          <Icon name="cross" size={6} />
                      </span>
                  ),
                  progressClassname: 'progress-bar--error',
              };

    return (
        <div className={clsx(['text-center', !display && 'mb-4'])}>
            {icon}
            <Progress
                className={clsx(['mt-4', progressClassname])}
                aria-describedby={id}
                value={value}
                max={max}
                {...rest}
            />
            {!!display && (
                <p aria-atomic="true" aria-live="polite" id={id}>
                    {display}
                </p>
            )}
        </div>
    );
};

export default DynamicProgress;
