import type { CircleLoaderSize } from '@proton/atoms/CircleLoader/CircleLoader';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

interface Props {
    size?: CircleLoaderSize;
    className?: string;
    style?: React.CSSProperties;
}

const Loader = ({ size = 'small', className = 'mx-auto flex my-8', style }: Props) => {
    return (
        <div className={className} style={style}>
            <CircleLoader className="m-auto" size={size} />
        </div>
    );
};

export default Loader;
