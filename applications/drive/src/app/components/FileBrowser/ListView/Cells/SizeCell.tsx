import { classnames } from '@proton/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

interface Props {
    size: number;
    className?: string;
}

export const SizeCell = ({ size, className }: Props) => {
    const readableSize = shortHumanSize(size);
    return (
        <div className={classnames(['text-ellipsis', className])} title={readableSize}>
            <span className="text-pre">{readableSize}</span>
        </div>
    );
};
