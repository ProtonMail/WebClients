import { SkeletonLoader } from '@proton/components';

export const NewsletterSubscriptionCardSkeleton = () => {
    return (
        <div className="subscription-card rounded-lg p-4 cursor-pointer md:p-5 border border-2 shadow-norm border-transparent">
            <div className="flex gap-3 md:gap-4">
                <div className="subscription-card-image shrink-0">
                    <SkeletonLoader width="2.25rem" height="2.25rem" className="rounded" />
                </div>
                <div className="flex-1">
                    <div className="flex mb-3">
                        <div className="flex-1 flex gap-3 md:gap-4">
                            <div
                                className="min-w-custom max-w-custom"
                                style={{
                                    '--min-w-custom': '12.5rem',
                                    '--max-w-custom': '12.5rem',
                                }}
                            >
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
