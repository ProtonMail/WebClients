import clsx from '@proton/utils/clsx';

import './PublicContainer.scss';

interface PublicContainerProps {
    children: React.ReactNode;
    className?: string;
}

const PublicContainer = ({ children, className: classNameProp }: PublicContainerProps) => {
    const className = clsx('flex flex-column flex-align-items-center mt-14 border p2 public-container', classNameProp);

    return <div className={className}>{children}</div>;
};

export default PublicContainer;
