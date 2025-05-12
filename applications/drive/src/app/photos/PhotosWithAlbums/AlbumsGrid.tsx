import type { FC, ReactNode } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Loader, useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import type { DecryptedAlbum } from '../PhotosStore/PhotosWithAlbumsProvider';
import { AlbumsCard } from './grid/AlbumsCard';

type AlbumsGridProps = {
    data: DecryptedAlbum[];
    onItemRender: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    onItemRenderLoadedLink: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    isLoading: boolean;
    onItemClick: (shareId: string, linkId: string) => void;
    onItemShare: (linkId: string) => void;
    onItemRename: (linkId: string) => void;
    onItemDelete: (album: DecryptedAlbum) => void;
};

export const AlbumsGrid: FC<AlbumsGridProps> = ({
    data,
    onItemRender,
    onItemRenderLoadedLink,
    isLoading,
    onItemClick,
    onItemShare,
    onItemRename,
    onItemDelete,
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
        const width = 16.875 * emRatio;
        const height = 11.75 * emRatio;

        // Gap between items (never scaled)
        const gap = 0.5 * emRatio;

        // Height of group (never scaled)
        const groupHeight = 2.75 * emRatio;

        // Amount of items per row (to calculate repsonsive scaling)
        const itemsPerLine = Math.max(2, Math.floor((containerWidth + gap) / (width + gap)));

        // Multiplicative scaling to apply to final values
        const scaling = (containerWidth - (itemsPerLine - 1) * gap) / (itemsPerLine * width);

        // Item dimensions (scaled)
        const itemHeight = height * scaling;
        const itemWidth = width * scaling;

        const additionalSpace = 3.6 * emRatio;

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
            additionalSpace,
            itemShouldRender,
        };
    }, [containerRect, emRatio]);

    const [gridItems, innerStyle] = useMemo(() => {
        if (!dimensions) {
            return [];
        }

        const { gap, itemHeight, itemWidth, itemsPerLine, itemShouldRender, additionalSpace } = dimensions;

        const items: ReactNode[] = [];

        let currentX = 0;
        let currentY = 0;

        let lastY = 0;

        // Attempt to make the animation a bit more dynamic
        // and not visually repetitive
        const animationOffset = Math.max(itemsPerLine === 7 ? 5 : 7, Math.round(itemsPerLine * 0.6));

        data.forEach((item, i) => {
            const x = currentX * (itemWidth + gap);
            const y = currentY;
            lastY = y;

            if (itemShouldRender(y, scrollPosition)) {
                items.push(
                    <AlbumsCard
                        key={`album-${item.linkId}-${item.rootShareId}`}
                        album={item}
                        onRender={onItemRender}
                        onRenderLoadedLink={onItemRenderLoadedLink}
                        onClick={() => {
                            onItemClick(item.rootShareId, item.linkId);
                        }}
                        onRename={() => {
                            onItemRename(item.linkId);
                        }}
                        onShare={() => {
                            onItemShare(item.linkId);
                        }}
                        onDelete={() => {
                            onItemDelete(item);
                        }}
                        style={{
                            position: 'absolute',
                            width: itemWidth,
                            height: itemHeight,
                            top: `${y}px`,
                            left: `${x}px`,
                            animationDelay: `${Math.round(((i % animationOffset) / (animationOffset / 2)) * 10) / 10}s`,
                        }}
                    />
                );
            }

            currentX++;
            if (currentX >= itemsPerLine) {
                currentY += itemHeight + gap + additionalSpace;
                currentX = 0;
            }
        });

        const innerStyle = {
            height: `${lastY + itemHeight + additionalSpace}px`,
        };

        return [items, innerStyle];
    }, [
        data,
        dimensions,
        scrollPosition,
        onItemClick,
        onItemRender,
        onItemRenderLoadedLink,
        onItemShare,
        onItemRename,
        onItemDelete,
    ]);

    return (
        <div className="mt-2 pt-4 px-4 overflow-auto outline-none--at-all" ref={containerRef} onScroll={handleScroll}>
            <div className="relative w-full" style={innerStyle}>
                {gridItems}
            </div>
            {isLoading && <Loader />}
        </div>
    );
};
