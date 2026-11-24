import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import { DENSITY } from '@proton/shared/lib/constants';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import clsx from '@proton/utils/clsx';

interface Props {
    rowCount: number;
    userSettings: UserSettings;
    contactRowHeightComfort?: number;
    contactRowHeightCompact?: number;
    rowRenderer: ({ index, style, key }: { index: number; style: CSSProperties; key: string }) => ReactNode;
    className?: string;
}

const ContactSelectorList = ({
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

    // value is based on 16px default font size: here we take into account of user root font size (can be different)
    const contactRowHeightComfortZoomingFriendlyValue = (contactRowHeightComfort / 16) * rootFontSize();
    const contactRowHeightCompactZoomingFriendlyValue = (contactRowHeightCompact / 16) * rootFontSize();

    return (
        <div ref={containerRef} className={clsx(['h-custom', className])} style={{ '--h-custom': `18.75rem` }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className="contact-list outline-none"
                        ref={listRef}
                        rowRenderer={rowRenderer}
                        rowCount={rowCount}
                        height={height}
                        width={width - 1}
                        rowHeight={
                            isCompactView
                                ? contactRowHeightCompactZoomingFriendlyValue
                                : contactRowHeightComfortZoomingFriendlyValue
                        }
                    />
                )}
            </AutoSizer>
        </div>
    );
};

export default ContactSelectorList;
