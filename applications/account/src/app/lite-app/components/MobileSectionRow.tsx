import clsx from '@proton/utils/clsx';

interface Props {
    children: React.ReactNode;
    stackContent?: boolean;
}

const MobileSectionRow = ({ children, stackContent = false }: Props) => {
    return (
        <div
            className={clsx([
                'relative flex flex-nowrap mb-0.5 p-5 bg-norm mobile-section-row',
                stackContent ? 'flex-column *:min-size-auto' : 'items-center',
            ])}
        >
            {children}
        </div>
    );
};

export default MobileSectionRow;
