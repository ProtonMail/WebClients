import { classnames } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

interface Props {
    size: number;
    className?: string;
}

const SizeCell = ({ size, className }: Props) => {
    const readableSize = humanSize(size);
    return (
        <div className={classnames(['text-ellipsis', className])} title={readableSize}>
            <span className="text-pre">{readableSize}</span>
        </div>
    );
};

export default SizeCell;
