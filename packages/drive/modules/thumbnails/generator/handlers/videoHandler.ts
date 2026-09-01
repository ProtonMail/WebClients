import { ThumbnailType } from '@protontech/drive-sdk';

import { type SupportedMimeTypes, VIDEO_THUMBNAIL_MAX_TIME_LOCATION } from '@proton/shared/lib/drive/constants';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS, isIosDevice } from '../constants';
import { FileLoadError, UnsupportedFormatError } from '../thumbnailError';
import { BaseHandler } from './baseHandler';
import type { ThumbnailGenerationResult } from './interfaces';
import { getImageFromCanvas } from './utils/getImageFromCanvas';
import { isIsoBmffContainer, parseMp4Metadata } from './utils/mp4BoxParser';

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
        originalMimeType: string,
        debug: boolean = false
    ): Promise<ThumbnailGenerationResult> {
        if (await this.isHevcCodec(content)) {
            throw new UnsupportedFormatError('HEVC codec not supported for thumbnail generation', {
                context: {
                    stage: 'codec detection',
                    fileSize,
                    mimeType: content.type,
                },
            });
        }

        if (isIosDevice && fileSize > MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS) {
            throw new UnsupportedFormatError('large video on iOS Safari', {
                context: {
                    stage: 'video size check',
                    fileSize,
                    mimeType: content.type,
                },
            });
        }

        const playsAsIs = canHtmlVideoPlay(originalMimeType);
        const playsAsMp4 = !playsAsIs && (await this.canPlayAsMp4(content, originalMimeType));
        if (!playsAsIs && !playsAsMp4) {
            throw new UnsupportedFormatError('video format not supported by browser', {
                context: {
                    stage: 'canPlayType check',
                    originalMimeType,
                    mimeType: content.type,
                },
            });
        }

        // Safari honours the blob's own MIME type for `<video src>`, so a mislabeled MP4 has to be
        // re-typed for the fallback to work there. Blob parts are references, so this doesn't copy.
        const videoContent = playsAsMp4 ? new Blob([content], { type: 'video/mp4' }) : content;

        const perf = this.createPerformanceTracker(debug);

        let videoInfo;
        try {
            perf.start('videoFrameExtraction');
            videoInfo = await this.extractVideoFrame(videoContent);
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
            const thumbnails = await this.generateThumbnailsFromImage({
                fileSize,
                img,
                mimeType,
                // Videos should not have HD Thumbnail: https://drive.gitlab-pages.protontech.ch/documentation/specifications/data/thumbnails/#type-2-hd-photo
                thumbnailTypes: [ThumbnailType.Type1],
                originalMimeType,
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

    // A file can be mislabeled by extension (e.g. Google Takeout renaming an MP4 export to `.avi`),
    // making `canHtmlVideoPlay(originalMimeType)` reject bytes the browser could actually decode fine
    // as MP4. Confirm via the container's own `ftyp` box before falling back to `video/mp4`.
    private async canPlayAsMp4(content: Blob, originalMimeType: string): Promise<boolean> {
        if (originalMimeType === 'video/mp4') {
            return false;
        }
        const header = await content.slice(0, 12).arrayBuffer();
        return isIsoBmffContainer(header) && canHtmlVideoPlay('video/mp4');
    }

    // HEVC/H.265 is the only common codec that causes browsers to hang during
    // thumbnail generation. Browsers report canPlayType('video/mp4') as supported
    // (based on the container), but silently fail or hang when decoding HEVC frames.
    // We detect it by scanning the file header for codec identifiers rather than
    // relying on canPlayType which cannot distinguish codecs within a container.
    private async isHevcCodec(content: Blob): Promise<boolean> {
        const HEADER_SIZE = 64 * 1024;
        const slice = content.slice(0, Math.min(HEADER_SIZE, content.size));
        const buffer = new Uint8Array(await new Response(slice).arrayBuffer());

        // MP4/MOV: look for 'hev1' or 'hvc1' box type (HEVC codec identifiers)
        const hev1 = [0x68, 0x65, 0x76, 0x31]; // 'hev1'
        const hvc1 = [0x68, 0x76, 0x63, 0x31]; // 'hvc1'

        for (let i = 0; i <= buffer.length - 4; i++) {
            if (
                (buffer[i] === hev1[0] &&
                    buffer[i + 1] === hev1[1] &&
                    buffer[i + 2] === hev1[2] &&
                    buffer[i + 3] === hev1[3]) ||
                (buffer[i] === hvc1[0] &&
                    buffer[i + 1] === hvc1[1] &&
                    buffer[i + 2] === hvc1[2] &&
                    buffer[i + 3] === hvc1[3])
            ) {
                return true;
            }
        }

        // MKV/WebM: look for codec ID string 'V_MPEGH/ISO/HEVC'
        const hevcMkv = new TextEncoder().encode('V_MPEGH/ISO/HEVC');
        for (let i = 0; i <= buffer.length - hevcMkv.length; i++) {
            let match = true;
            for (let j = 0; j < hevcMkv.length; j++) {
                if (buffer[i + j] !== hevcMkv[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return true;
            }
        }

        return false;
    }

    // Chrome reports `video.duration` as `Infinity`, and `videoWidth`/`videoHeight`
    // as `0`, for fragmented MP4 (no `mvhd`/`mdhd` duration, no sample table, so
    // it never gets a full prescan). Fall back to reading both straight from the
    // box structure, which we can do cheaply since the whole file is already
    // local at upload time.
    private async resolveVideoMetadata(
        video: HTMLVideoElement,
        content: Blob
    ): Promise<{ width: number; height: number; duration: number }> {
        const validDuration = Number.isFinite(video.duration) && video.duration > 0;
        const validDimensions = video.videoWidth > 0 && video.videoHeight > 0;
        if (validDuration && validDimensions) {
            return { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
        }

        const metadata = parseMp4Metadata(await content.arrayBuffer());
        return {
            width: validDimensions ? video.videoWidth : (metadata?.width ?? video.videoWidth),
            height: validDimensions ? video.videoHeight : (metadata?.height ?? video.videoHeight),
            duration: validDuration ? video.duration : (metadata?.durationInSeconds ?? video.duration),
        };
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
                            const { width, height, duration } = await this.resolveVideoMetadata(video, content);
                            cleanup(listeners);
                            resolve({
                                img,
                                videoDimensions: { width, height },
                                duration,
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

/**
 * Whether the MIME type can be played in an HTML `<video>` element.
 *
 * If `document` or `canPlayType` is unavailable, we optimistically assume it
 * is possible.
 *
 * MOV (`video/quicktime`) and MP4 share the same ISO BMFF container; browsers
 * often reject `video/quicktime` while still decoding H.264/AAC, so we fall back
 * to checking `video/mp4` for QuickTime files.
 */
export function canHtmlVideoPlay(mime: string | undefined): boolean {
    if (!mime) {
        return false;
    }
    if (typeof document === 'undefined') {
        return true;
    }
    try {
        const testVideo = document.createElement('video');
        const canPlay = testVideo.canPlayType(mime) !== '';
        if (!canPlay && mime === 'video/quicktime') {
            return testVideo.canPlayType('video/mp4') !== '';
        }
        return canPlay;
    } catch {
        return true;
    }
}
