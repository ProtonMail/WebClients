import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

interface Props {
    size: number;
    className?: string;
}

export const SizeCell = ({ size, className }: Props) => {
    const readableSize = shortHumanSize(size);
    return (
        <div className={clsx(['flex items-center', className])} title={readableSize}>
            <span className="text-ellipsis text-pre">{readableSize}</span>
        </div>
    );
};
