import { Icon } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

interface Props {
    children: React.ReactNode;
    stackContent?: boolean;
    to: string;
    coloredLink?: boolean;
}

const MobileSectionLink = ({ children, stackContent = false, to, coloredLink = true }: Props) => {
    return (
        <div className="relative flex flex-nowrap mb-0.5 p-5 bg-norm items-center mobile-section-row">
            <div
                className={clsx([
                    'flex-1 flex flex-nowrap',
                    stackContent ? 'flex-column *:min-size-auto' : 'items-center',
                ])}
            >
                <a
                    href={to}
                    className={clsx(['text-no-decoration expand-click-area', !coloredLink && 'color-inherit'])}
                >
                    {children}
                </a>
            </div>
            <Icon name="chevron-right" className="shrink-0" />
        </div>
    );
};

export default MobileSectionLink;
