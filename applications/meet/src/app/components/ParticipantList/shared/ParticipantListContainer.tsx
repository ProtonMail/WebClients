export const ParticipantListContainer = ({
    title,
    setIsScrolled,
    children,
}: {
    title: string;
    setIsScrolled: (isScrolled: boolean) => void;
    children: React.ReactNode;
}) => {
    return (
        <div
            className="flex-1 overflow-y-auto w-full h-full participants-list px-4"
            onScroll={(event) => {
                setIsScrolled(event.currentTarget.scrollTop > 0);
            }}
        >
            <h2 className="sr-only">{title}</h2>
            <ul className="unstyled m-0 p-0 flex flex-column flex-nowrap gap-4">{children}</ul>
        </div>
    );
};
