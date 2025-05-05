import type { FC, ReactNode } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Loader, useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import type { PhotoGridItem } from '../../store';
import { isPhotoGroup } from '../../store/_photos';
import { PhotosCard } from './grid/PhotosCard';
import { PhotosGroup } from './grid/PhotosGroup';

type Props = {
    data: PhotoGridItem[];
    onItemRender: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    onItemRenderLoadedLink: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    selectedItems: PhotoGridItem[];
    isLoading: boolean;
    onItemClick: (linkId: string) => void;
    onSelectChange: (index: number, isSelected: boolean) => void;
    isGroupSelected: (groupIndex: number) => boolean | 'some';
    isItemSelected: (linkId: string) => boolean;
    categoryLoading?: string;
    isAddAlbumPhotosView?: boolean;
    onFavorite?: (linkId: string, shareId: string, isFavorite: boolean) => void;
    rootLinkId: string;
    hasSelection: boolean;
};

export const PhotosGrid: FC<Props> = ({
    data,
    onItemRender,
    onItemRenderLoadedLink,
    isLoading,
    onItemClick,
    onSelectChange,
    selectedItems,
    isGroupSelected,
    isItemSelected,
    isAddAlbumPhotosView,
    onFavorite,
    rootLinkId,
    hasSelection,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerRect = useElementRect(containerRef);

    const [scrollPosition, setScrollPosition] = useState(0);
    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            if (!containerRef || !containerRef.current) {
                return;
            }

            setScrollPosition(containerRef.current.scrollTop);
        });
    }, [containerRef, setScrollPosition]);

    const emRatio = rootFontSize();
    const dimensions = useMemo(() => {
        if (!containerRect) {
            return null;
        }

        // Inner scroll container dimensions
        const containerWidth = containerRect.width - 2 * emRatio;
        const containerHeight = containerRect.height;

        // Item base dimensions (should be scaled)
        const width = 10 * emRatio;
        const height = 13.75 * emRatio;

        // Gap between items (never scaled)
        const gap = 0.25 * emRatio;

        // Height of group (never scaled)
        const groupHeight = 2.75 * emRatio;

        // Amount of items per row (to calculate repsonsive scaling)
        const itemsPerLine = Math.max(2, Math.floor((containerWidth + gap) / (width + gap)));

        // Multiplicative scaling to apply to final values
        const scaling = (containerWidth - (itemsPerLine - 1) * gap) / (itemsPerLine * width);

        // Item dimensions (scaled)
        const itemHeight = height * scaling;
        const itemWidth = width * scaling;

        // Helper to know if an item is within the viewport
        const scrollMargin = (itemHeight + gap) * 2;
        const itemShouldRender = (y: number, scrollPosition: number) =>
            y >= scrollPosition - itemHeight - scrollMargin && y <= scrollPosition + containerHeight + scrollMargin;

        return {
            itemHeight,
            itemWidth,
            gap,
            groupHeight,
            itemsPerLine,
            itemShouldRender,
        };
    }, [containerRect, emRatio]);

    const [gridItems, innerStyle] = useMemo(() => {
        if (!dimensions) {
            return [];
        }

        const { gap, itemHeight, itemWidth, groupHeight, itemsPerLine, itemShouldRender } = dimensions;

        const items: ReactNode[] = [];

        let currentX = 0;
        let currentY = 0;

        let lastY = 0;

        // Attempt to make the animation a bit more dynamic
        // and not visually repetitive
        const animationOffset = Math.max(itemsPerLine === 7 ? 5 : 7, Math.round(itemsPerLine * 0.6));

        data.forEach((item, i) => {
            if (isPhotoGroup(item)) {
                if (currentX != 0) {
                    currentY += itemHeight + gap;
                }
                currentX = 0;

                const y = currentY;
                lastY = y;

                if (itemShouldRender(y, scrollPosition)) {
                    items.push(
                        <PhotosGroup
                            key={item}
                            style={{
                                position: 'absolute',
                                height: `${groupHeight}px`,
                                width: '100%',
                                top: `${y}px`,
                            }}
                            text={item}
                            // Do not show separator on first item
                            showSeparatorLine={i > 0}
                            onSelect={(isSelected) => {
                                onSelectChange(i, isSelected);
                            }}
                            selected={isGroupSelected(i)}
                            isLoading={isLoading}
                        />
                    );
                }

                currentY += groupHeight + gap;
            } else {
                const x = currentX * (itemWidth + gap);
                const y = currentY;
                lastY = y;

                const isSelected = isItemSelected(item.linkId);

                if (itemShouldRender(y, scrollPosition)) {
                    items.push(
                        <PhotosCard
                            key={item.linkId}
                            photo={item}
                            onRender={onItemRender}
                            onRenderLoadedLink={onItemRenderLoadedLink}
                            onClick={() => {
                                if (hasSelection) {
                                    onSelectChange(i, !isSelected);
                                } else {
                                    onItemClick(item.linkId);
                                }
                            }}
                            onSelect={(isSelected) => {
                                onSelectChange(i, isSelected);
                            }}
                            selected={isSelected}
                            style={{
                                position: 'absolute',
                                width: itemWidth,
                                height: itemHeight,
                                top: `${y}px`,
                                left: `${x}px`,
                                animationDelay: `${
                                    Math.round(((i % animationOffset) / (animationOffset / 2)) * 10) / 10
                                }s`,
                            }}
                            hasSelection={hasSelection}
                            isFavorite={item.photoProperties?.isFavorite || false}
                            isOwnedByCurrentUser={item.parentLinkId === rootLinkId}
                            onFavorite={
                                !isAddAlbumPhotosView && onFavorite
                                    ? () => {
                                          onFavorite(
                                              item.linkId,
                                              item.rootShareId,
                                              item.photoProperties?.isFavorite || false
                                          );
                                      }
                                    : undefined
                            }
                        />
                    );
                }

                currentX++;
                if (currentX >= itemsPerLine) {
                    currentY += itemHeight + gap;
                    currentX = 0;
                }
            }
        });

        const innerStyle = {
            height: `${lastY + itemHeight}px`,
        };

        return [items, innerStyle];
    }, [data, isItemSelected, isGroupSelected, dimensions, scrollPosition, isLoading, selectedItems]);

    return (
        <div className={clsx('p-4 overflow-auto outline-none--at-all')} ref={containerRef} onScroll={handleScroll}>
            <div className="relative w-full" style={innerStyle}>
                {gridItems}
            </div>
            {isLoading && <Loader />}
        </div>
    );
};
