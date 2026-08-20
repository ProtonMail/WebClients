interface ChatHistoryLoadingSkeletonProps {
    rows?: number;
    className?: string;
}

export const ChatHistoryLoadingSkeleton = ({ rows = 8, className }: ChatHistoryLoadingSkeletonProps) => {
    return (
        <div className={className ?? 'flex flex-column gap-1 px-1.5 pt-1'}>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="skeleton rounded-lg"
                    style={{ height: '32px', opacity: 1 - index * 0.08 }}
                />
            ))}
        </div>
    );
};
