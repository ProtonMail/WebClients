import { classnames } from '../../helpers';
import { Loader } from '../loader';
import Icon from '../icon/Icon';
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
                  <span className="inline-flex bg-success rounded50 p0-5">
                      <Icon name="on" size={24} />
                  </span>
              ),
              progressClassname: 'progress-bar--success',
          }
        : partialSuccess
        ? {
              icon: (
                  <span className="inline-flex bg-warning rounded50 p0-5">
                      <Icon name="off" size={24} />
                  </span>
              ),
              progressClassname: 'progress-bar--warning',
          }
        : {
              icon: (
                  <span className="inline-flex bg-danger rounded50 p0-5">
                      <Icon name="off" size={24} />
                  </span>
              ),
              progressClassname: 'progress-bar--error',
          };

    return (
        <div className={classnames(['text-center', !display && 'mb1'])}>
            {icon}
            <Progress
                className={classnames(['mt1', progressClassname])}
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
