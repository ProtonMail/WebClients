import { memo } from 'react';

import { ItemCheckbox, useFlag } from '@proton/components/containers';
import { Breakpoints } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { Element } from '../../models/element';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';

interface Props {
    conversationMode: boolean;
    elementID?: string;
    labelID: string;
    isCompactView: boolean;
    loading: boolean;
    columnLayout: boolean;
    element: Element;
    index: number;
    breakpoints: Breakpoints;
}

const SkeletonItem = ({
    labelID,
    conversationMode,
    isCompactView,
    loading,
    element,
    columnLayout,
    index,
    breakpoints,
}: Props) => {
    const ItemLayout = columnLayout ? ItemColumnLayout : ItemRowLayout;

    const isDelightMailListEnabled = useFlag('DelightMailList');

    return (
        <div
            className={clsx(
                'item-container-wrapper relative',
                (isCompactView || !columnLayout) && 'border-bottom border-weak'
            )}
        >
            <div
                className={clsx([
                    'flex-1 flex flex-nowrap cursor-pointer group-hover-opacity-container unread',
                    loading && 'item-is-loading',
                    ...(isDelightMailListEnabled
                        ? [
                              columnLayout
                                  ? 'delight-item-container delight-item-container--column'
                                  : 'delight-item-container delight-item-container--row',
                          ]
                        : [columnLayout ? 'item-container item-container-column' : 'item-container-row']),
                ])}
                style={{ '--index': index }}
                data-element-id={element.ID}
                data-shortcut-target="item-container"
                data-testid={`message-item:${element.Subject}`}
                data-testorder={element.Order}
            >
                <ItemCheckbox
                    ID={element.ID}
                    checked={false}
                    compactClassName="mr-3 stop-propagation"
                    normalClassName={
                        isDelightMailListEnabled ? 'mr-3' : clsx(['ml-0.5', columnLayout ? 'mr-2 mt-0.5' : 'mr-2'])
                    }
                    variant={isDelightMailListEnabled ? 'small' : undefined}
                />
                <ItemLayout
                    isCompactView={isCompactView}
                    labelID={labelID}
                    elementID={element.ID}
                    element={element}
                    conversationMode={conversationMode}
                    showIcon={false}
                    unread={false}
                    breakpoints={breakpoints}
                    isSelected={false}
                />
            </div>
        </div>
    );
};

export default memo(SkeletonItem);
