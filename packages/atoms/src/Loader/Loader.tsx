import type { CircleLoaderSize } from '../CircleLoader/CircleLoader';
import { CircleLoader } from '../CircleLoader/CircleLoader';

interface Props {
    size?: CircleLoaderSize;
    className?: string;
    style?: React.CSSProperties;
}

export const Loader = ({ size = 'small', className = 'mx-auto flex my-8', style }: Props) => {
    return (
        <div className={className} style={style}>
            <CircleLoader className="m-auto" size={size} />
        </div>
    );
};
