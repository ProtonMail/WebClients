import { ReactNode, Ref } from 'react';
import TopBanners from '../topBanners/TopBanners';
import { classnames } from '../../helpers';
import ErrorBoundary from './ErrorBoundary';

interface Props {
    containerRef?: Ref<HTMLDivElement>;
    header: ReactNode;
    sidebar: ReactNode;
    children: ReactNode;
    topBanners?: ReactNode;
    isBlurred?: boolean;
    hasTopBanners?: boolean;
}

const PrivateAppContainer = ({
    header,
    sidebar,
    children,
    topBanners,
    hasTopBanners = true,
    isBlurred = false,
    containerRef,
}: Props) => {
    return (
        <div
            className={classnames([
                'content-container flex flex-column flex-nowrap no-scroll',
                isBlurred && 'filter-blur',
            ])}
            ref={containerRef}
        >
            {hasTopBanners ? topBanners || <TopBanners /> : null}
            <div className="content ui-prominent flex-item-fluid-auto flex flex-column flex-nowrap reset4print">
                <ErrorBoundary small>{header}</ErrorBoundary>
                <div className="flex flex-item-fluid flex-nowrap">
                    <ErrorBoundary className="inline-block">{sidebar}</ErrorBoundary>
                    <div className="main ui-standard flex flex-column flex-nowrap flex-item-fluid">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default PrivateAppContainer;
