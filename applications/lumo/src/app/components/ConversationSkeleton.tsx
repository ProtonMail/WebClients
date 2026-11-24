import './Skeleton.scss';

const ConversationSkeleton = () => {
    return (
        <div className="flex flex-column flex-nowrap gap-4 px-8 py-6 h-full">
            {/* Header skeleton */}
            <div className="flex flex-column gap-2">
                <div className="skeleton w-1/3 h-custom" style={{ '--h-custom': '1.5rem' }}></div>
            </div>

            {/* Message chain skeleton */}
            <div
                className="flex flex-column flex-nowrap flex-1 gap-8 w-full max-w-custom mx-auto mt-4"
                style={{ '--max-w-custom': '45rem' }}
            >
                {/* Message 1 */}
                <div className="flex flex-column gap-2 w-1/2 self-end items-end">
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-5/6 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-2/3 h-custom" style={{ '--h-custom': '1rem' }}></div>
                </div>

                {/* Message 2 */}
                <div className="flex flex-column gap-2">
                    <div className="skeleton w-4/5 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-1/2 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-2/3 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-2/3 h-custom" style={{ '--h-custom': '1rem' }}></div>
                    <div className="skeleton w-3/4 h-custom" style={{ '--h-custom': '1rem' }}></div>
                </div>
            </div>

            {/* Composer placeholder */}
            <div className="w-full max-w-custom mx-auto mt-4" style={{ '--max-w-custom': '60rem' }}>
                <div
                    className="lumo-input-container relative w-full h-custom p-1.5 border lumo-border-mid radius-28 lumo-bg-panel-elevated lumo-elevation-1 duration-150 lumo-easing-standard"
                    style={{ '--h-custom': '6.25rem' }}
                ></div>
            </div>
        </div>
    );
};

export default ConversationSkeleton;
