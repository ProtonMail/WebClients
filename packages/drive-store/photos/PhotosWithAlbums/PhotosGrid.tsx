import type { FC, ReactNode } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Loader, useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import type { PhotoGridItem } from '../../store';
import { isPhotoGroup } from '../../store/_photos';
import { FastScrollBar, getYearAndMonthFromCaptureTime } from './FastScrollBar';
import { PhotosCard } from './grid/PhotosCard';
import { PhotosGroup } from './grid/PhotosGroup';

import './PhotosGrid.scss';

const SCROLLBAR_CONTAINER_WIDTH = 48;

type PhotosGridProps = {
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

export const PhotosGrid: FC<PhotosGridProps> = ({
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
    const positions = useRef<Map<number, number>>(new Map());
    const groupsPositions = useRef<Map<string, number>>(new Map());
    const groupsMetadata = useRef<{ index: number; y: number; year: number; month: number }[]>([]);
    const scrollTimeout = useRef<number | null>(null);
    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [currentTopGroup, setCurrentTopGroup] = useState<{ year: number; month: number } | undefined>(undefined);
    const emRatio = rootFontSize();

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        setIsScrolling(true);
        if (scrollTimeout.current !== null) {
            clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = window.setTimeout(() => {
            setIsScrolling(false);
            scrollTimeout.current = null;
        }, 200);

        requestAnimationFrame(() => {
            const scrollTop = container.scrollTop;
            setScrollPosition(scrollTop);

            // Find the group at the top using stored positions
            const threshold = 2.75 * emRatio;
            let topGroup: { year: number; month: number } | undefined;

            // Iterate through groups from bottom to top to find the visible one
            for (let i = groupsMetadata.current.length - 1; i >= 0; i--) {
                const group = groupsMetadata.current[i];
                if (group.y <= scrollTop + threshold) {
                    topGroup = { year: group.year, month: group.month };
                    break;
                }
            }

            if (topGroup) {
                setCurrentTopGroup(topGroup);
            }
        });
    }, [emRatio]);

    const visibleHeight = useMemo(() => {
        if (!containerRect) {
            return 0;
        }
        const viewportTop = 0;
        const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
        // Calculate overlap between [rect.top, rect.bottom] and [viewportTop, viewportBottom]
        const visibleTop = Math.max(containerRect.top, viewportTop);
        const visibleBottom = Math.min(containerRect.bottom, viewportBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        return visibleHeight;
    }, [containerRect]);

    const dimensions = useMemo(() => {
        if (!containerRect) {
            return null;
        }
        // Inner scroll container dimensions
        const containerWidth = containerRect.width - 2 * emRatio - SCROLLBAR_CONTAINER_WIDTH;
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

        // Clear and rebuild groups metadata
        groupsMetadata.current = [];

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
                positions.current.set(i, y);

                const nextItem = data[i + 1];
                let groupYear: number | undefined = undefined;
                let groupMonth: number | undefined = undefined;

                if (isPhotoGroup(nextItem) === false) {
                    const ym = getYearAndMonthFromCaptureTime(nextItem.activeRevision?.photo?.captureTime);
                    if (ym) {
                        const { year, month } = ym;
                        groupYear = year;
                        groupMonth = month;
                        groupsPositions.current.set(`${year}-${month}`, y);
                        // Store group metadata for faster scroll calculations
                        groupsMetadata.current.push({ index: i, y, year, month });
                    }
                }

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
                            year={groupYear}
                            month={groupMonth}
                        />
                    );
                }
                currentY += groupHeight + gap;
            } else {
                const x = currentX * (itemWidth + gap);
                const y = currentY;
                lastY = y;
                const isSelected = isItemSelected(item.linkId);
                positions.current.set(i, y);

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
            height: lastY + itemHeight,
            itemWidth,
        };

        return [items, innerStyle];
    }, [
        data,
        isItemSelected,
        isGroupSelected,
        dimensions,
        scrollPosition,
        isLoading,
        selectedItems,
        positions,
        groupsPositions,
    ]);

    return (
        <div className={'photos-grid-container relative'}>
            <div
                className={clsx('photos-grid-container-left p-0 pl-4 outline-none--at-all')}
                ref={containerRef}
                onScroll={handleScroll}
            >
                {innerStyle && (
                    <div
                        className="photos-grid-container-left-inner w-full"
                        style={{ height: `${innerStyle.height + 24}px` }}
                    >
                        {gridItems}
                    </div>
                )}
            </div>
            {containerRect && innerStyle && (
                <FastScrollBar
                    data={data}
                    containerRef={containerRef}
                    containerRect={containerRect}
                    containerHeight={visibleHeight - 24}
                    groupsPositions={groupsPositions}
                    innerStyle={innerStyle}
                    isScrolling={isScrolling}
                    currentTopGroup={currentTopGroup}
                />
            )}
            {isLoading && <Loader />}
        </div>
    );
};
