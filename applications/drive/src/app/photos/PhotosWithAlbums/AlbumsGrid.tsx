import type { FC } from 'react';
import React from 'react';

import { Loader } from '@proton/components';

import type { Album } from '../PhotosStore/PhotosWithAlbumsProvider';

type AlbumsGridProps = {
    data: Album[];
    onItemRender: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    onItemRenderLoadedLink: (linkId: string, domRef: React.MutableRefObject<unknown>) => void;
    isLoading: boolean;
    onItemClick: (linkId: string) => void;
};

export const AlbumsGrid: FC<AlbumsGridProps> = ({
    data,
    // onItemRender,
    // onItemRenderLoadedLink,
    isLoading,
    // onItemClick
}) => {
    // TODO: Render Albums Items
    // console.info("To be used:", data, onItemRender, onItemRenderLoadedLink, isLoading, onItemClick)
    return (
        <div className="p-4 overflow-auto outline-none--at-all">
            <div className="relative w-full">Albums Items</div>
            {data.map((album) => (
                <div>
                    LinkID: {album.LinkID} Photo Count: {album.PhotoCount}
                </div>
            ))}
            {isLoading && <Loader />}
        </div>
    );
};
