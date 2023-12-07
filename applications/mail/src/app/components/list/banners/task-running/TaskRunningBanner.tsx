import { c } from 'ttag';

import { Icon, useFlag } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
}

const TaskRunningBanner = ({ className }: Props) => {
    const isDelightMailListEnabled = useFlag('DelightMailList');

    return (
        <div
            className={clsx([
                'rounded mx-2 px-4 py-2 flex flex-wrap justify-start items-center',
                !isDelightMailListEnabled && 'bg-weak',
                className,
            ])}
        >
            <div className="shrink-0 flex">
                <Icon name="clock" className="mr-2" />
            </div>
            <div className="flex-1 pl-1">{c('Info').t`Moving messages. This may take a while.`}</div>
        </div>
    );
};

export default TaskRunningBanner;
