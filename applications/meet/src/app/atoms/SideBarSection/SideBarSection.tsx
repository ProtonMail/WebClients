import clsx from '@proton/utils/clsx';

import './SideBarSection.scss';

interface SideBarSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const SideBarSection = ({ title, children, className }: SideBarSectionProps) => {
    return (
        <section
            className={clsx(
                'side-bar-section flex flex-column items-start flex-nowrap gap-4 w-full py-6 px-4 meet-radius',
                className
            )}
            aria-label={title}
        >
            <h3 className="text-rg color-norm m-0 text-semibold">{title}</h3>

            {children}
        </section>
    );
};
