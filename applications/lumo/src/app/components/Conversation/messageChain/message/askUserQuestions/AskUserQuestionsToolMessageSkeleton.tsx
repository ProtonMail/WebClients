import { c } from 'ttag';

import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';

import './AskUserQuestionsToolMessageSkeleton.scss';

export const AskUserQuestionsToolMessageSkeleton = () => (
    <div
        aria-busy="true"
        className="ask-user-questions-tool-message-skeleton flex flex-column flex-nowrap w-full rounded-xl bg-norm"
    >
        <span className="sr-only">
            {
                // translator: Accessible status while follow-up questions are being prepared.
                c('collider_2025:Info').t`Preparing questions`
            }
        </span>
        <div className="flex flex-nowrap items-center justify-space-between gap-3 p-4 pb-2 pl-5">
            <SkeletonLoader width="60%" />
            <SkeletonLoader width="3rem" />
        </div>
        <div className="flex flex-column flex-nowrap gap-2 p-5 pt-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-nowrap items-center gap-3 p-3 border border-weak rounded-lg">
                    <SkeletonLoader className="mb-0" height="1rem" index={index + 1} width="1rem" />
                    <SkeletonLoader className="mb-0" index={index + 1} width="70%" />
                </div>
            ))}
        </div>
        <div className="flex flex-nowrap items-center justify-end gap-2 p-3 pl-5 border-top border-weak">
            <SkeletonLoader className="mb-0 rounded" height="1.5rem" index={5} width="3rem" />
            <SkeletonLoader className="mb-0 rounded" height="1.5rem" index={5} width="1.5rem" />
        </div>
    </div>
);
