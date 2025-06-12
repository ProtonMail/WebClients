import { SkeletonLoader } from '@proton/components';

export const NewsletterSubscriptionCardSkeleton = () => {
    return (
        <div className="subscription-card rounded-lg p-4 cursor-pointer md:p-5 border border-2 shadow-norm border-transparent mb-4">
            <div className="flex gap-3 md:gap-4">
                <div className="subscription-card-image shrink-0">
                    <SkeletonLoader width="2.25rem" height="2.25rem" className="rounded" />
                </div>
                <div className="flex-1">
                    <div className="flex">
                        <div className="subscription-card-content flex-1 flex flex-nowrap gap-3 md:gap-4">
                            <div className="subscription-card-title w-custom max-w-full">
                                <SkeletonLoader width="10rem" height="1.25rem" className="mb-1" />
                                <SkeletonLoader width="11.25rem" height="1rem" />
                            </div>
                            <div className="flex flex-column gap-2 text-sm color-weak">
                                <SkeletonLoader width="9.5rem" height="1rem" />
                                <SkeletonLoader width="9.5rem" height="1rem" />
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <SkeletonLoader width="1rem" height="1.5rem" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <SkeletonLoader width="6rem" height="1.75rem" />
                        <SkeletonLoader width="6rem" height="1.75rem" />
                    </div>
                </div>
            </div>
        </div>
    );
};
