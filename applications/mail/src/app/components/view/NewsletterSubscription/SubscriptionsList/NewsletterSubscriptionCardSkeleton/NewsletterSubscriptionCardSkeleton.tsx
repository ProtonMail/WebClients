import { SkeletonLoader } from '@proton/components';

export const NewsletterSubscriptionCardSkeleton = () => {
    return (
        <div className="flex flex-nowrap shrink-0 gap-3 rounded-lg p-4 subscription-card cursor-pointer md:p-5 md:gap-4 border border-2 shadow-norm overflow-hidden border-transparent">
            <div className="shrink-0 subscription-card-image">
                <SkeletonLoader width="2.25rem" height="2.25rem" />
            </div>
            <div className="flex flex-column text-left gap-2 w-full md:gap-4 md:flex-row">
                <div className="flex flex-column max-w-full md:w-3/5 lg:w-1/2">
                    <SkeletonLoader width="8.75rem" height="1.25rem" className="mb-1" />
                    <SkeletonLoader width="12.5rem" height="1rem" />
                    <div className="mt-2 flex gap-2 md:mt-3">
                        <SkeletonLoader width="6rem" height="1.75rem" />
                        <SkeletonLoader width="6rem" height="1.75rem" />
                    </div>
                </div>
                <div className="flex flex-column gap-3 text-sm color-weak">
                    <SkeletonLoader width="9.5rem" height="1rem" />
                    <SkeletonLoader width="9.5rem" height="1rem" />
                </div>
            </div>
        </div>
    );
};
