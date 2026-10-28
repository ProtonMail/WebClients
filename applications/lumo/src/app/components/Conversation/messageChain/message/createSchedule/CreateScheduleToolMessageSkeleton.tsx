import { clsx } from 'clsx';
import { c } from 'ttag';

import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';

import { LumoIcon } from '../../../../LumoIcon/LumoIcon';

import './CreateScheduleToolMessageSkeleton.scss';

export const CreateScheduleToolMessageSkeleton = () => {
    return (
        <div
            aria-busy="true"
            className="create-schedule-tool-message-skeleton flex flex-column flex-nowrap items-start gap-4 p-5 text-rg rounded-xl bg-norm"
        >
            <div className="flex flex-nowrap shrink-0 items-center gap-2 min-w-0 w-full">
                <LumoIcon aria-hidden className="shrink-0" name="Clock" size={14} />
                <h3
                    aria-label={
                        // translator: Accessible label for the heading inviting the user to schedule a recurring or one-time task (imperative), currently loading...
                        c('collider_2025:Title').t`Schedule task, currently loading…`
                    }
                    className="shrink-0 m-0 text-rg text-semibold"
                >{
                    // translator: Heading inviting the user to schedule a recurring or one-time task (imperative).
                    c('collider_2025:Title').t`Schedule task`
                }</h3>
                <span aria-hidden className="color-weak">
                    ·
                </span>
                <SkeletonLoader width="7rem" />
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex flex-column flex-nowrap items-start gap-4 w-full">
                    <SkeletonLoader index={index + 1} width="10rem" />
                    <div
                        className={clsx(
                            'flex flex-column flex-nowrap items-start gap-2 text-xs w-full px-4 py-3 border border-weak rounded-xl',
                            index === 1 && 'create-schedule-tool-message-skeleton__card'
                        )}
                    >
                        <SkeletonLoader index={index + 1} width="100%" />
                        <SkeletonLoader index={index + 1} width="100%" />
                        <SkeletonLoader index={index + 1} className="mb-0" width="80%" />
                    </div>
                </div>
            ))}
            <div className="flex flex-nowrap shrink-0 items-center gap-2 min-w-0 w-full">
                <SkeletonLoader height="2rem" index={3} width="5rem" />
                <SkeletonLoader height="2rem" index={3} width="5rem" />
            </div>
        </div>
    );
};
