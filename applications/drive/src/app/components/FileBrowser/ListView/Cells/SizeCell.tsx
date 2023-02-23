import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

interface Props {
    size: number;
    className?: string;
}

export const SizeCell = ({ size, className }: Props) => {
    const readableSize = shortHumanSize(size);
    return (
        <div className={clsx(['text-ellipsis', className])} title={readableSize}>
            <span className="text-pre">{readableSize}</span>
        </div>
    );
};
