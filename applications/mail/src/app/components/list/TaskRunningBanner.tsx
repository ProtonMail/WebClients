import { c } from 'ttag';
import { Icon, classnames } from '@proton/components';

interface Props {
    className?: string;
}

const TaskRunningBanner = ({ className }: Props) => {
    return (
        <div
            className={classnames([
                'bg-weak rounded mx1 mb1 px1 py0-5 flex flex-wrap flex-justify-start flex-align-items-center',
                className,
            ])}
        >
            <Icon name="clock" className="mr0-5" />
            {c('Info').t`Moving a large amount of messages. This may take a while.`}
        </div>
    );
};

export default TaskRunningBanner;
