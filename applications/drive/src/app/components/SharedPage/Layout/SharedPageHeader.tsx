import { useActiveBreakpoint } from '@proton/components/hooks';

import { DownloadButton, DownloadButtonProps } from './DownloadButton';

interface Props extends DownloadButtonProps {
    children: React.ReactNode;
}

export default function SharedPageHeader({ children, rootItem, items, onDownload }: Props) {
    const { isNarrow } = useActiveBreakpoint();
    return (
        <div
            className="flex flex-nowrap flex-justify-space-between mb1 min-h-custom"
            style={{ '--min-height-custom': '80px' }}
        >
            <div className="flex flex-nowrap flex-item-fluid flex-align-items-center mb0 pb0 mr1 shared-page-layout-header">
                {children}
            </div>
            {isNarrow || items.length === 0 ? null : (
                <DownloadButton onDownload={onDownload} rootItem={rootItem} items={items} />
            )}
        </div>
    );
}
