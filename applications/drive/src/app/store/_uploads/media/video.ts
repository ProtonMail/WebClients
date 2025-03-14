import { VIDEO_THUMBNAIL_MAX_TIME_LOCATION } from '@proton/shared/lib/drive/constants';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { logError } from '../../../utils/errorHandling';
import { canvasToThumbnail } from './canvasUtil';
import type { Media, ThumbnailInfo } from './interface';
import { ThumbnailType } from './interface';
import { calculateThumbnailSize } from './util';

type ListenerContainer = readonly {
    type: keyof HTMLVideoElementEventMap;
    listener: (event?: Event) => void;
}[];

interface Props extends Media {
    thumbnails?: ThumbnailInfo[];
}
// Unfortunately Safari doesn't support Canvas.drawImage using videos anymore.
export const canGenerateThumbnail = (): boolean => !isSafari();

// Creating video thumbnails can be resource heavy operation. Especially if we load multiple, high-res videos.
// Another risk factor is memory leakage. Video elements should be cleared carefully after using them.
// The video should not be added to the DOM - the last thing we want here is displaying them.
// thumbnailType is not actually use for video, we always use preview
export const getVideoInfo = async (file: Blob) => {
    const promiseInit = (resolve: (value: Props | undefined) => void, reject: (reason?: string) => void) => {
        const video: HTMLVideoElement = document.createElement('video') as HTMLVideoElement;
        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        video.autoplay = false;
        video.autofocus = false;
        video.defaultMuted = true;
        video.muted = true;
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#preload
        video.preload = 'auto';

        const destruct = (result: Props | undefined, listeners: ListenerContainer): void => {
            resolve(result);
            listeners.forEach((pair) =>
                video.removeEventListener<keyof HTMLVideoElementEventMap>(pair.type, pair.listener)
            );

            video.src = '';
            URL.revokeObjectURL(objectUrl);
        };

        // Let's set up events before we start loading the video
        const listeners: ListenerContainer = [
            {
                type: 'loadedmetadata',
                listener: () => {
                    // Seeking in the video happens asynchronously, we will need another event handler
                    video.currentTime = Math.min(VIDEO_THUMBNAIL_MAX_TIME_LOCATION, video.duration / 10);
                },
            },
            {
                type: 'timeupdate',
                listener: async () => {
                    if (!canGenerateThumbnail()) {
                        destruct(
                            {
                                width: video.videoWidth,
                                height: video.videoHeight,
                                duration: video.duration,
                            },
                            listeners
                        );
                    }
                    if (video.currentTime === 0) {
                        // To test if we were able to create a thumbnail, we have to check if the browser
                        // was able to play the video
                        // An alternative way of checking would be using !video.canPlayType(file.type),
                        // but according to the documentation it provides only an educated guess.
                        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType
                        // Instead I start the playback and pause it immediately. In case there was an error,
                        // we know for sure the media was not playable.
                        video
                            .play()
                            .then(() => video.pause())
                            .catch(() => destruct(undefined, listeners));
                        return;
                    }
                    const canvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
                    const [width, height] = calculateThumbnailSize({
                        width: video.videoWidth,
                        height: video.videoHeight,
                    });

                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext('2d');
                    if (!context) {
                        reject("Couldn't create canvas context for video thumbnail creation.");
                        return;
                    }
                    await context.drawImage(video, 0, 0, width, height);
                    try {
                        destruct(
                            {
                                width: video.videoWidth,
                                height: video.videoHeight,
                                duration: video.duration,
                                thumbnails: [
                                    {
                                        thumbnailData: new Uint8Array(
                                            await canvasToThumbnail(
                                                canvas,
                                                ThumbnailType.PREVIEW,
                                                isSafari() ? 'image/jpeg' : 'image/webp'
                                            )
                                        ),
                                        thumbnailType: ThumbnailType.PREVIEW,
                                    },
                                ],
                            },
                            listeners
                        );
                    } catch (e) {
                        logError(e);
                        destruct(undefined, listeners);
                    }
                },
            },
            { type: 'error', listener: () => destruct(undefined, listeners) },
        ];

        listeners.forEach((pair) => video.addEventListener<keyof HTMLVideoElementEventMap>(pair.type, pair.listener));

        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/load
        video.load();
    };

    return new Promise<Props | undefined>(promiseInit);
};
