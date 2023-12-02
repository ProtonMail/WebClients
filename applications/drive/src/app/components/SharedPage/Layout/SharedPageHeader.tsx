import { useActiveBreakpoint } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { DownloadButton, DownloadButtonProps } from './DownloadButton';

interface Props extends DownloadButtonProps {
    children: React.ReactNode;
    className?: string;
}

export default function SharedPageHeader({ children, rootItem, items, className }: Props) {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <div className={clsx('flex flex-nowrap justify-space-between items-center', className)}>
            <div className="flex flex-nowrap flex-1 items-center mb-0 pb-0 mr-4 shared-page-layout-header">
                {children}
            </div>
            {viewportWidth['<=small'] || items.length === 0 ? null : (
                <DownloadButton rootItem={rootItem} items={items} />
            )}
        </div>
    );
}
