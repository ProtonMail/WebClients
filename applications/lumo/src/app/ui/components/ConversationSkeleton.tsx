import './Skeleton.scss';

const ConversationSkeleton = () => {
    return (
        <div className="flex flex-column flex-nowrap gap-4 px-8 py-6 h-full">
            {/* Header skeleton */}
            <div className="flex flex-column gap-2">
                <div className="skeleton w-1/3 h-custom" style={{ '--h-custom': '24px' }}></div>
            </div>

            {/* Message chain skeleton */}
            <div
                className="flex flex-column flex-nowrap flex-1 w-full md:w-2/3 mx-auto max-w-custom gap-8 mt-4"
                style={{ '--max-w-custom': '46.5rem' }}
            >
                {/* Message 1 */}
                <div className="flex flex-column gap-2 w-1/2 self-end items-end">
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-5/6 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-2/3 h-custom" style={{ '--h-custom': '16px' }}></div>
                </div>

                {/* Message 2 */}
                <div className="flex flex-column gap-2">
                    <div className="skeleton w-4/5 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-1/2 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-2/3 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-2/3 h-custom" style={{ '--h-custom': '16px' }}></div>
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '16px' }}></div>
                </div>
            </div>

            {/* Composer skeleton */}
            <div className="mt-4 w-full md:w-2/3 mx-auto max-w-custom" style={{ '--max-w-custom': '46.5rem' }}>
                <div className="skeleton lumo-input-container w-full h-custom" style={{ '--h-custom': '105px' }}></div>
            </div>
        </div>
    );
};

export default ConversationSkeleton;
