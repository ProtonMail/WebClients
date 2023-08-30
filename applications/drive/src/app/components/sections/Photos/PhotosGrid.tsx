import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import { PhotoGridItem, PhotoLink, usePhotosView } from '../../../store/_views/usePhotosView';
import { PhotosCard, PhotosGroup } from './grid';

import './grid/PhotosGrid.scss';

type Props = {
    data: PhotoGridItem[];
    getPhotoLink: ReturnType<typeof usePhotosView>['getPhotoLink'];
    onItemRender: (item: PhotoLink) => void;
    shareId: string;
};

export const PhotosGrid: FC<Props> = ({ data, onItemRender, shareId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerRect = useElementRect(containerRef);
    const [itemsPerLine, setItemsPerLine] = useState(0);
    const [itemScaling, setItemScaling] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [posX, setPosX] = useState<number[]>([]);
    const [posY, setPosY] = useState<number[]>([]);

    const itemDimensions = useMemo(() => {
        const emRatio = rootFontSize();

        return {
            width: 10 * emRatio,
            height: 13.75 * emRatio,
            gap: 0.25 * emRatio,
            groupHeight: 2.75 * emRatio,
        };
    }, []);

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
    const safetyMargin = itemHeight * 3;

    useEffect(() => {
        if (!itemDimensions) {
            return;
        }

        const posX = [];
        const posY = [];

        let currentX = 0;
        let currentY = 0;
        for (let item of data) {
            if (typeof item === 'string') {
                if (currentX != 0) {
                    currentY += itemHeight + itemDimensions.gap;
                }
                currentX = 0;

                posX.push(currentX);
                posY.push(currentY);

                currentY += itemDimensions.groupHeight + itemDimensions.gap;
            } else {
                posX.push(currentX * (itemWidth + itemDimensions.gap));
                posY.push(currentY);

                currentX++;
                if (currentX >= itemsPerLine) {
                    currentY += itemHeight + itemDimensions.gap;
                    currentX = 0;
                }
            }
        }

        setPosX(posX);
        setPosY(posY);
    }, [data, itemDimensions, itemScaling, itemsPerLine]);

    const gridItems = [];

    const startIndex = posY.findIndex((value) => value >= scrollPosition - itemHeight - safetyMargin);
    const endIndex = posY.findLastIndex((value) => value <= scrollPosition + containerHeight + safetyMargin);

    if (startIndex >= 0 && endIndex >= 0) {
        for (let i = startIndex; i <= endIndex; i++) {
            const item = data[i];
            const x = posX[i];
            const y = posY[i];

            if (typeof item === 'string') {
                gridItems.push(
                    <PhotosGroup
                        style={{
                            position: 'absolute',
                            height: `${itemDimensions.groupHeight}px`,
                            width: '100%',
                            top: `${y}px`,
                        }}
                        text={item}
                        showSeparatorLine={i !== 0}
                    />
                );
            } else {
                gridItems.push(
                    <PhotosCard
                        key={item.linkId}
                        photo={item}
                        onRender={onItemRender}
                        style={{
                            position: 'absolute',
                            width: itemWidth,
                            height: itemHeight,
                            top: `${y}px`,
                            left: `${x}px`,
                            // This makes the loading animation more dynamic (7 is arbitrary)
                            animationDelay: `${(i % 7) / 3.5}s`,
                        }}
                        shareId={shareId}
                    />
                );
            }
        }
    }

    return (
        <div
            className="p-4 overflow-auto"
            onScroll={(event) => {
                setScrollPosition(event.currentTarget.scrollTop);
                setContainerHeight(event.currentTarget.clientHeight);
            }}
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
        </div>
    );
};
