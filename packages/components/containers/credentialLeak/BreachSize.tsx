import { dateLocale } from '@proton/shared/lib/i18n';

interface Props {
    size: number;
    className?: string;
}

const BreachSize = ({ size, ...rest }: Props) => {
    const formatSize = () => {
        if (!size) {
            return;
        }
        return new Intl.NumberFormat(dateLocale.code, {
            notation: 'compact',
            compactDisplay: 'long',
            maximumSignificantDigits: 2,
        }).format(size);
    };

    return <span {...rest}>{formatSize()}</span>;
};

export default BreachSize;
