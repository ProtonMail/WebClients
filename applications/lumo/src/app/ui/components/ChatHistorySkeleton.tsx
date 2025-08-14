import './Skeleton.scss';

const ChatHistorySkeleton = () => {
    return (
        <div className="h-full w-full flex flex-column flex-nowrap gap-2">
            {/* Search input skeleton */}
            <div className="skeleton w-full h-custom mt-1" style={{ '--h-custom': '40px' }}></div>

            {/* Favorites section skeleton */}
            <div className="flex flex-column gap-2 mt-2">
                <div className="skeleton w-1/3 h-custom" style={{ '--h-custom': '16px' }}></div>
                <div className="skeleton w-full h-custom" style={{ '--h-custom': '40px' }}></div>
                <div className="skeleton w-full h-custom" style={{ '--h-custom': '40px' }}></div>
            </div>

            <hr className="mt-2 mb-0 border-bottom border-weak" />

            {/* Recent chats skeleton */}
            <div className="flex-1 flex flex-column gap-2">
                <div className="skeleton w-1/4 h-custom" style={{ '--h-custom': '16px' }}></div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton w-full h-custom" style={{ '--h-custom': '40px' }}></div>
                ))}
            </div>
        </div>
    );
};

export default ChatHistorySkeleton;
