import { useActiveBreakpoint } from '@proton/components/hooks';

import { DownloadButton, DownloadButtonProps } from './DownloadButton';

interface Props extends DownloadButtonProps {
    children: React.ReactNode;
}

export default function SharedPageHeader({ children, rootItem, items }: Props) {
    const { isNarrow } = useActiveBreakpoint();
    return (
        <div
            className="flex flex-nowrap flex-justify-space-between mb-4 min-h-custom"
            style={{ '--min-h-custom': '5rem' }}
        >
            <div className="flex flex-nowrap flex-item-fluid flex-align-items-center mb-0 pb-0 mr-4 shared-page-layout-header">
                {children}
            </div>
            {isNarrow || items.length === 0 ? null : <DownloadButton rootItem={rootItem} items={items} />}
        </div>
    );
}
