import './SideBar.scss';

interface SideBarProps {
    children: React.ReactNode;
}

export const SideBar = ({ children }: SideBarProps) => {
    return (
        <div className="meet-side-bar bg-norm border-strong flex flex-nowrap flex-column p-4 h-full w-full rounded-xl relative">
            {children}
        </div>
    );
};
