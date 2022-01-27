import { useRef, CSSProperties, ReactNode } from 'react';
import { List, AutoSizer } from 'react-virtualized';
import { DENSITY } from '@proton/shared/lib/constants';
import { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import { classnames } from '../../helpers';

interface Props {
    rowCount: number;
    userSettings: UserSettings;
    contactRowHeightComfort?: number;
    contactRowHeightCompact?: number;
    rowRenderer: ({ index, style, key }: { index: number; style: CSSProperties; key: string }) => ReactNode;
    className?: string;
}

const ContactsList = ({
    rowCount,
    contactRowHeightComfort = 54,
    contactRowHeightCompact = 46,
    rowRenderer,
    className = '',
    userSettings,
}: Props) => {
    const listRef = useRef(null);
    const containerRef = useRef(null);
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    return (
        <div ref={containerRef} className={classnames(['h-custom', className])} style={{ '--height-custom': `300px` }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className="contact-list outline-none"
                        ref={listRef}
                        rowRenderer={rowRenderer}
                        rowCount={rowCount}
                        height={height}
                        width={width - 1}
                        rowHeight={isCompactView ? contactRowHeightCompact : contactRowHeightComfort}
                    />
                )}
            </AutoSizer>
        </div>
    );
};

export default ContactsList;
