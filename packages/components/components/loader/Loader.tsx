import { CircleLoader, CircleLoaderSize } from '@proton/atoms';

interface Props {
    size?: CircleLoaderSize;
    className?: string;
}

const Loader = ({ size = 'small', className = 'center flex my2' }: Props) => {
    return (
        <div className={className}>
            <CircleLoader className="mauto" size={size} />
        </div>
    );
};

export default Loader;
