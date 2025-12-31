import type { ThumbnailType } from '@protontech/drive-sdk';

import { type SupportedMimeTypes, VIDEO_THUMBNAIL_MAX_TIME_LOCATION } from '@proton/shared/lib/drive/constants';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS, isIosDevice } from '../constants';
import { FileLoadError, UnsupportedFormatError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromCanvas } from './utils/getImageFromCanvas';

export class VideoHandler extends BaseHandler {
    readonly handlerName = 'VideoHandler';

    canHandle(mimeType: string): boolean {
        return isVideo(mimeType);
    }

    async generate(
        content: Blob,
        fileName: string,
        fileSize: number,
        mimeType: SupportedMimeTypes.webp | SupportedMimeTypes.jpg,
        thumbnailTypes: ThumbnailType[],
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        if (isIosDevice && fileSize > MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS) {
            throw new UnsupportedFormatError('large video on iOS Safari', {
                context: {
                    stage: 'video size check',
                    fileSize: fileSize,
                    mimeType: content.type,
                },
            });
        }

        const perf = this.createPerformanceTracker(debug);

        let videoInfo;
        try {
            perf.start('videoFrameExtraction');
            videoInfo = await this.extractVideoFrame(content);
            perf.end('videoFrameExtraction');
        } catch (error) {
            perf.end('videoFrameExtraction');
            // Some video formats/codecs aren't supported by browser
            throw new UnsupportedFormatError('video codec', {
                context: {
                    stage: 'video frame extraction',
                    fileSize: fileSize,
                    mimeType: content.type,
                },
                cause: error instanceof Error ? error : undefined,
            });
        }

        const { img, videoDimensions, duration } = videoInfo;

        try {
            const thumbnails = await this.generateThumbnailsFromImage(fileSize, img, {
                mimeType,
                thumbnailTypes,
                customDimensions: videoDimensions,
                duration,
                perf,
            });

            return {
                thumbnails,
                performance: perf.getResults(),
            };
        } finally {
            URL.revokeObjectURL(img.src);
        }
    }

    private extractVideoFrame(content: Blob): Promise<{
        img: HTMLImageElement;
        videoDimensions: { width: number; height: number };
        duration: number;
    }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const objectUrl = URL.createObjectURL(content);

            video.src = objectUrl;
            video.autoplay = false;
            video.autofocus = false;
            video.defaultMuted = true;
            video.muted = true;
            video.preload = 'auto';

            type ListenerContainer = readonly {
                type: keyof HTMLVideoElementEventMap;
                listener: (event?: Event) => void;
            }[];

            const cleanup = (listeners: ListenerContainer): void => {
                listeners.forEach((pair) => video.removeEventListener(pair.type, pair.listener));
                video.src = '';
                URL.revokeObjectURL(objectUrl);
            };

            const listeners: ListenerContainer = [
                {
                    type: 'loadedmetadata',
                    listener: () => {
                        video.currentTime = Math.min(VIDEO_THUMBNAIL_MAX_TIME_LOCATION, video.duration / 10);
                    },
                },
                {
                    type: 'seeked',
                    listener: async () => {
                        if (video.currentTime === 0) {
                            // Test if we can play the video to ensure it's valid
                            try {
                                await video.play();
                                video.pause();
                            } catch (error) {
                                cleanup(listeners);
                                reject(
                                    new FileLoadError('Video playback test failed', {
                                        context: {
                                            stage: 'video playback test',
                                        },
                                    })
                                );
                                return;
                            }
                        }

                        try {
                            // Create canvas to extract frame
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;

                            const context = canvas.getContext('2d', { willReadFrequently: true });
                            if (!context) {
                                cleanup(listeners);
                                reject(
                                    new FileLoadError("Couldn't create canvas context for video thumbnail", {
                                        context: {
                                            stage: 'video canvas context creation',
                                            canvasWidth: canvas.width,
                                            canvasHeight: canvas.height,
                                        },
                                    })
                                );
                                return;
                            }

                            // Draw video frame to canvas
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const img = await getImageFromCanvas(canvas);
                            resolve({
                                img,
                                videoDimensions: { width: video.videoWidth, height: video.videoHeight },
                                duration: video.duration,
                            });
                        } catch (error) {
                            cleanup(listeners);
                            reject(
                                new FileLoadError('Failed to extract video frame', {
                                    context: {
                                        stage: 'video frame extraction',
                                        videoWidth: video.videoWidth,
                                        videoHeight: video.videoHeight,
                                    },
                                    cause: error instanceof Error ? error : undefined,
                                })
                            );
                        }
                    },
                },
                {
                    type: 'error',
                    listener: (event?: Event) => {
                        cleanup(listeners);
                        const errorDetail =
                            event && 'error' in event && event.error ? (event.error as Error).message : 'Unknown error';
                        reject(
                            new FileLoadError('Video loading error', {
                                context: {
                                    stage: 'video loading',
                                    error: errorDetail,
                                },
                            })
                        );
                    },
                },
            ];

            listeners.forEach((pair) => video.addEventListener(pair.type, pair.listener));
            video.load();
        });
    }
}
