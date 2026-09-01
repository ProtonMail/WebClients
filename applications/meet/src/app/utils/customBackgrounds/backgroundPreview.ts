import type { Thumbnail } from '@proton/drive';
import { ThumbnailType } from '@proton/drive';
import { generateThumbnail } from '@proton/drive/public/thumbnails';
import noop from '@proton/utils/noop';

export interface PreparedBackground {
    thumbnails: Thumbnail[];
    preview?: Uint8Array<ArrayBuffer>;
}

export const prepareBackground = async (file: File): Promise<PreparedBackground> => {
    const { thumbnailsPromise, mimeTypePromise } = generateThumbnail(file, file.name, file.size);

    mimeTypePromise.catch(noop);

    const generated = await thumbnailsPromise;
    const thumbnails: Thumbnail[] = generated.ok ? (generated.result?.thumbnails ?? []) : [];

    return {
        thumbnails,
        preview: thumbnails.find(({ type }) => type === ThumbnailType.Type1)?.thumbnail,
    };
};
