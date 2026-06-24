export const SettingsArea = ({ title, children }: { title: string; children: React.ReactNode }) => {
    return (
        <div className="flex flex-column flex-nowrap w-full gap-4 shrink-0">
            <h3 className="text-semibold text-rg color-weak pb-2 shrink-0">{title}</h3>
            <div className="flex flex-column flex-nowrap w-full gap-4 pl-4">{children}</div>
        </div>
    );
};
