import { clsx } from 'clsx';

export const PrejoinDetailsHeaderShell = ({
    title,
    subtitle,
    titleClassName,
    subtitleClassName,
    visibleOnMobile = false,
}: {
    title: React.ReactNode;
    subtitle?: string;
    titleClassName?: string;
    subtitleClassName?: string;
    visibleOnMobile?: boolean;
}) => {
    return (
        <>
            <h1
                className={clsx(
                    'title text-semibold text-center m-0',
                    !visibleOnMobile && 'hidden md:flex',
                    titleClassName
                )}
            >
                {title}
            </h1>
            {subtitle && (
                <div
                    className={clsx('text-center color-weak', !visibleOnMobile && 'hidden md:block', subtitleClassName)}
                >
                    {subtitle}
                </div>
            )}
        </>
    );
};
