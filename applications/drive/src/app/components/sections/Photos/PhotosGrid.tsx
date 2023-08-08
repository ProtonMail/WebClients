import React, { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Photo } from '../../../store/_photos/interfaces';
import { usePhotosView } from '../../../store/_views/usePhotosView';
import { PhotosCard } from './grid';

export type PhotoGridItem = Photo | string;

type Props = {
    data: PhotoGridItem[];
    getPhotoLink: ReturnType<typeof usePhotosView>['getPhotoLink'];
};

type ItemDimensions = {
    width: number;
    height: number;
    gap: number;
    groupHeight: number;
};

export const PhotosGrid: FC<Props> = ({ data, getPhotoLink }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [itemDimensions, setItemDimensions] = useState<ItemDimensions>();
    const [itemsPerLine, setItemsPerLine] = useState(0);
    const [itemScaling, setItemScaling] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [posX, setPosX] = useState<number[]>([]);
    const [posY, setPosY] = useState<number[]>([]);

    useLayoutEffect(() => {
        if (!containerRef.current) {
            return;
        }

        // Get the em-to-pixel ratio to calculate item dimensions
        let div = document.createElement('div');

        div.classList.add('w-4');
        document.body.appendChild(div);

        let emRatio = div.getBoundingClientRect().width;
        const dimensions: ItemDimensions = {
            width: 10 * emRatio,
            height: 13.75 * emRatio,
            gap: 0.25 * emRatio,
            groupHeight: 2 * emRatio,
        };
        setItemDimensions(dimensions);

        document.body.removeChild(div);

        // Calculate how many elements we can have per line
        const calc = (rect: DOMRect | DOMRectReadOnly) => {
            const containerWidth = rect.width;

            let maxItems = (containerWidth + dimensions.gap) / (dimensions.width + dimensions.gap);
            let itemsPerLine = Math.max(1, Math.floor(maxItems));
            let scaling = (containerWidth - (itemsPerLine - 1) * dimensions.gap) / (itemsPerLine * dimensions.width);

            setItemsPerLine(itemsPerLine);
            setItemScaling(scaling);
        };

        calc(containerRef.current.getBoundingClientRect());

        // Set up an observer for when we resize the element
        const resizeObserver = new ResizeObserver(([elem]) => {
            calc(elem.contentRect);
        });

        resizeObserver.observe(containerRef.current);

        // Clean up observer
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const itemHeight = (itemDimensions?.height || 0) * itemScaling;
    const itemWidth = (itemDimensions?.width || 0) * itemScaling;
    const safetyMargin = itemHeight * 3;

    useEffect(() => {
        if (!itemDimensions) {
            return;
        }

        let posX = [];
        let posY = [];

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

    let gridItems = [];

    let startIndex = posY.findIndex((value) => value >= scrollPosition - itemHeight - safetyMargin);
    let endIndex = posY.findLastIndex((value) => value <= scrollPosition + containerHeight + safetyMargin);

    if (startIndex >= 0 && endIndex >= 0) {
        for (let i = startIndex; i <= endIndex; i++) {
            const item = data[i];
            const x = posX[i];
            const y = posY[i];

            if (typeof item === 'string') {
                gridItems.push(
                    <div
                        style={{
                            position: 'absolute',
                            height: `${itemDimensions?.groupHeight || 0}px`,
                            width: '100%',
                            top: `${y}px`,
                            backgroundColor: 'blue',
                            color: 'white',
                        }}
                    >
                        {item}
                    </div>
                );
            } else {
                // void getPhotoLink(new AbortController().signal, item.linkId);
                gridItems.push(
                    <PhotosCard
                        key={item.linkId}
                        photo={item}
                        style={{
                            position: 'absolute',
                            backgroundColor: 'red',
                            width: itemWidth,
                            height: itemHeight,
                            top: `${y}px`,
                            left: `${x}px`,
                        }}
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
