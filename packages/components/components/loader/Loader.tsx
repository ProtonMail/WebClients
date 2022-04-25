import CircleLoader, { Size } from './CircleLoader';

interface Props {
    size?: Size;
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
