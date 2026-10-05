import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
}

const ContextSeparator = ({ className = '', ...rest }: Props) => {
    return <hr className={clsx(['m-0', className])} {...rest} />;
};

export default ContextSeparator;
