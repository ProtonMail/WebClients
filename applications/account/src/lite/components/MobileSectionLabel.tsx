import clsx from '@proton/utils/clsx';

interface Props {
    htmlFor: string;
    children: React.ReactNode;
    description?: React.ReactNode | string;
    small?: boolean;
}

const MobileSectionLabel = ({ htmlFor, children, description, small = false }: Props) => {
    return (
        <label htmlFor={htmlFor} className="flex-1 flex flex-column flex-nowrap mr-4">
            <span className={clsx([small ? 'color-weak' : 'text-semibold text-lg'])}>{children}</span>
            {description && <div className="color-weak">{description}</div>}
        </label>
    );
};

export default MobileSectionLabel;
