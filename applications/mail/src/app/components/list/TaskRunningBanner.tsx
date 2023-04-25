import { c } from 'ttag';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
}

const TaskRunningBanner = ({ className }: Props) => {
    return (
        <div
            className={clsx([
                'bg-weak rounded mx-4 mb-4 px1 py0-5 flex flex-wrap flex-justify-start flex-align-items-center',
                className,
            ])}
        >
            <div className="flex-item-noshrink flex">
                <Icon name="clock" className="mr-2" />
            </div>
            <div className="flex-item-fluid pl0-25">{c('Info').t`Moving messages. This may take a while.`}</div>
        </div>
    );
};

export default TaskRunningBanner;
