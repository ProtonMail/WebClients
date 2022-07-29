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
            <div className="flex-item-noshrink flex">
                <Icon name="clock" className="mr0-5" />
            </div>
            <div className="flex-item-fluid pl0-25">
                {c('Info').t`Moving a large amount of messages. This may take a while.`}
            </div>
        </div>
    );
};

export default TaskRunningBanner;
