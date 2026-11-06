import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode;
}

const Content = ({ children, className, ...rest }: Props) => {
    return (
        <div className={clsx('sign-layout-main-content', className)} {...rest}>
            {children}
        </div>
    );
};

export default Content;
