import Loader from '@proton/components/components/loader/Loader';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
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
    // eslint-disable-next-line no-nested-ternary
    const { icon, progressClassname = '' } = loading
        ? {
              icon: <Loader />,
          }
        : // eslint-disable-next-line no-nested-ternary
          success
          ? {
                icon: (
                    <span className="inline-flex bg-success rounded-50 p-2">
                        <IcCheckmark size={6} />
                    </span>
                ),
                progressClassname: 'progress-bar--success',
            }
          : partialSuccess
            ? {
                  icon: (
                      <span className="inline-flex bg-warning rounded-50 p-2">
                          <IcCross size={6} />
                      </span>
                  ),
                  progressClassname: 'progress-bar--warning',
              }
            : {
                  icon: (
                      <span className="inline-flex bg-danger rounded-50 p-2">
                          <IcCross size={6} />
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
