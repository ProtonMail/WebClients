import { CircleLoader, CircleLoaderSize } from '@proton/atoms';


interface Props {
    size?: CircleLoaderSize;
    className?: string;
}

const Loader = ({ size = 'small', className = 'mx-auto flex my-8' }: Props) => {
    return (
        <div className={className}>
            <CircleLoader className="m-auto" size={size} />
        </div>
    );
};

export default Loader;