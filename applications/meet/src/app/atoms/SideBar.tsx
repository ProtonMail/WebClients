interface SideBarProps {
    children: React.ReactNode;
}

export const SideBar = ({ children }: SideBarProps) => {
    return (
        <div className="bg-norm border-strong flex flex-nowrap flex-column p-4 h-full w-full rounded-xl">
            {children}
        </div>
    );
};
