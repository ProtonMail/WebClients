import { memo } from 'react';

import { ItemCheckbox } from '@proton/components/containers';
import clsx from '@proton/utils/clsx';

import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';
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

    return (
        <div
            className={clsx(
                'item-container-wrapper relative',
                (isCompactView || !columnLayout) && 'border-bottom border-weak'
            )}
        >
            <div
                className={clsx([
                    'flex-item-fluid flex flex-nowrap cursor-pointer opacity-on-hover-container unread',
                    loading && 'item-is-loading',
                    columnLayout ? 'item-container item-container-column' : 'item-container-row',
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
                    normalClassName={clsx(['ml-0.5', columnLayout ? 'mr-2 mt-0.5' : 'mr-2'])}
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
