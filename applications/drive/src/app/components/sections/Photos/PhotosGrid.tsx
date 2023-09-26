import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Loader, useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import throttle from '@proton/utils/throttle';

import type { PhotoGridItem } from '../../../store';
import { usePortalPreview } from '../../PortalPreview';
import { useDetailsModal } from '../../modals/DetailsModal';
import { PhotosCard, PhotosGroup } from './grid';

type Props = {
    data: PhotoGridItem[];
    onItemRender: (linkId: string, domRef: React.MutableRefObject<any>) => void;
    shareId: string;
    isLoadingMore: boolean;
};

export const PhotosGrid: FC<Props> = ({ data, onItemRender, shareId, isLoadingMore }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerRect = useElementRect(containerRef);
    const [itemsPerLine, setItemsPerLine] = useState(0);
    const [itemScaling, setItemScaling] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [posY, setPosY] = useState<number[]>([]);
    const [styleCache, setStyleCache] = useState<React.CSSProperties[]>([]);

    const [portalPreview, showPortalPreview] = usePortalPreview();
    const [detailsModal, showDetailsModal] = useDetailsModal();

    const emRatio = rootFontSize();
    const itemDimensions = useMemo(() => {
        return {
            width: 10 * emRatio,
            height: 13.75 * emRatio,
            gap: 0.25 * emRatio,
            groupHeight: 2.75 * emRatio,
        };
    }, [emRatio]);

    useLayoutEffect(() => {
        if (!containerRect) {
            return;
        }

        const { width, gap } = itemDimensions;
        const containerWidth = containerRect.width;

        const maxItems = (containerWidth + gap) / (width + gap);
        const itemsPerLine = Math.max(1, Math.floor(maxItems));
        const scaling = (containerWidth - (itemsPerLine - 1) * gap) / (itemsPerLine * width);

        setItemsPerLine(itemsPerLine);
        setItemScaling(scaling);
    }, [containerRect]);

    const itemHeight = itemDimensions.height * itemScaling;
    const itemWidth = itemDimensions.width * itemScaling;
    const safetyMargin = (itemHeight + itemDimensions.gap) * 2;

    useEffect(() => {
        if (!itemDimensions) {
            return;
        }

        const posY = [];
        const styleCache = [];

        let currentX = 0;
        let currentY = 0;
        for (let item of data) {
            const i: number = styleCache.length;

            if (typeof item === 'string') {
                if (currentX != 0) {
                    currentY += itemHeight + itemDimensions.gap;
                }
                currentX = 0;

                const y = currentY;

                posY.push(y);
                styleCache.push({
                    position: 'absolute',
                    height: `${itemDimensions.groupHeight}px`,
                    width: '100%',
                    top: `${y}px`,
                });

                currentY += itemDimensions.groupHeight + itemDimensions.gap;
            } else {
                const x = currentX * (itemWidth + itemDimensions.gap);
                const y = currentY;

                posY.push(y);
                styleCache.push({
                    position: 'absolute',
                    width: itemWidth,
                    height: itemHeight,
                    top: `${y}px`,
                    left: `${x}px`,
                    // This makes the loading animation more dynamic (7 is arbitrary)
                    animationDelay: `${(i % 7) / 3.5}s`,
                });

                currentX++;
                if (currentX >= itemsPerLine) {
                    currentY += itemHeight + itemDimensions.gap;
                    currentX = 0;
                }
            }
        }

        setPosY(posY);
        setStyleCache(styleCache);
    }, [data, itemDimensions, itemScaling, itemsPerLine]);

    const gridItems = [];

    const startIndex = posY.findIndex((value) => value >= scrollPosition - itemHeight - safetyMargin);
    const endIndex = posY.findLastIndex((value) => value <= scrollPosition + containerHeight + safetyMargin);

    if (startIndex >= 0 && endIndex >= 0) {
        for (let i = startIndex; i <= endIndex; i++) {
            const item = data[i];
            const style = styleCache[i];

            if (typeof item === 'string') {
                gridItems.push(<PhotosGroup key={item} style={style} text={item} showSeparatorLine={i !== 0} />);
            } else {
                gridItems.push(
                    <PhotosCard
                        key={item.linkId}
                        photo={item}
                        onRender={onItemRender}
                        showPortalPreview={showPortalPreview}
                        showDetailsModal={showDetailsModal}
                        style={style}
                        shareId={shareId}
                    />
                );
            }
        }
    }

    return (
        <>
            {detailsModal}
            {portalPreview}
            <div
                className="p-4 overflow-auto"
                onScroll={throttle((event) => {
                    setScrollPosition(event.currentTarget.scrollTop);
                    setContainerHeight(event.currentTarget.clientHeight);
                }, 100)}
                onLoad={(event) => {
                    setContainerHeight(event.currentTarget.clientHeight);
                }}
            >
                <div
                    className="relative w-full"
                    style={{ height: `${posY[posY.length - 1] + itemHeight}px` }}
                    ref={containerRef}
                >
                    {gridItems}
                </div>
                {isLoadingMore && <Loader />}
            </div>
        </>
    );
};
