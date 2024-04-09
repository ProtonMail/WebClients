import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

interface Props {
    size: number;
}
const HeaderSize = ({ size }: Props) => {
    const readableSize = shortHumanSize(size);

    return (
        <div>
            <span className="color-disabled mx-2" aria-hidden="true">
                •
            </span>
            <span className="color-weak text-pre">{readableSize}</span>
        </div>
    );
};

export default HeaderSize;
