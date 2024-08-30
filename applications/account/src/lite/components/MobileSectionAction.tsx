import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    children: React.ReactNode;
    stackContent?: boolean; // The content is displayed horizontally by default
    onClick: () => void;
    coloredLink?: boolean;
}

const MobileSectionAction = ({ children, stackContent = false, onClick, coloredLink = true }: Props) => {
    return (
        <div className="relative flex flex-nowrap mb-0.5 p-5 bg-norm items-center mobile-section-row">
            <div
                className={clsx([
                    'flex-1 flex flex-nowrap',
                    stackContent ? 'flex-column *:min-size-auto' : 'items-center',
                ])}
            >
                <button
                    type="button"
                    onClick={onClick}
                    className={clsx([
                        'text-no-decoration expand-click-area text-left',
                        !coloredLink && 'color-inherit',
                    ])}
                >
                    {children}
                </button>
            </div>
            <Icon name="chevron-right" className="shrink-0" />
        </div>
    );
};

export default MobileSectionAction;
