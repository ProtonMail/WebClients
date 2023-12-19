import { c } from 'ttag';

import { Loader, useFlag } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
}

const TaskRunningBanner = ({ className }: Props) => {
    const isDelightMailListEnabled = useFlag('DelightMailList');

    return (
        <div className={clsx(['w-full text-center', !isDelightMailListEnabled && 'border-bottom bg-weak border-weak'])}>
            <div className={clsx(['px-4 py-2 inline-flex mx-auto flex-wrap justify-start items-center', className])}>
                <div className="shrink-0 flex">
                    <Loader className="mr-2 flex" />
                </div>
                <div className="flex-1 pl-1 text-left">{c('Info')
                    .t`Message actions in progress. This may take a while.`}</div>
            </div>
        </div>
    );
};

export default TaskRunningBanner;
