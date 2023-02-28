import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode;
}

const Footer = ({ children, className, ...rest }: Props) => {
    return (
        <div className={clsx(['border-top flex p1', className])} {...rest}>
            {children}
        </div>
    );
};

export default Footer;
