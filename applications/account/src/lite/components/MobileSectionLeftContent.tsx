import clsx from '@proton/utils/clsx';

interface Props {
    centered?: boolean;
    children: React.ReactNode;
    className?: string;
}

const MobileSectionLeftContent = ({ children, centered = true, className }: Props) => {
    return (
        <>
            <div className={clsx(['flex shrink-0 mr-2', centered && 'items-center', className])}>{children}</div>
        </>
    );
};

export default MobileSectionLeftContent;
