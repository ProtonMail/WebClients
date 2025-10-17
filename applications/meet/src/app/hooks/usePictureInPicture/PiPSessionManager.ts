import { isSafari } from '@proton/shared/lib/helpers/browser';

import { PIP_PREVIEW_ITEM_HEIGHT, PIP_PREVIEW_ITEM_WIDTH } from '../../constants';
import type { TrackInfo } from './types';

export class PiPSessionManager {
    private canvas?: HTMLCanvasElement;
    private pipVideo?: HTMLVideoElement;

    /**
     * Initialize PiP session with canvas and video elements
     */
    init(tracks: TrackInfo[]): { canvas: HTMLCanvasElement; pipVideo: HTMLVideoElement } {
        // Create canvas with fixed 16:9 aspect ratio
        const canvas = this.createCanvas(tracks);
        const pipVideo = this.createVideoElement();

        this.canvas = canvas;
        this.pipVideo = pipVideo;

        return { canvas, pipVideo };
    }

    /**
     * Create canvas element for rendering
     */
    private createCanvas(tracks: TrackInfo[]): HTMLCanvasElement {
        const canvas = document.createElement('canvas');

        canvas.width = PIP_PREVIEW_ITEM_WIDTH;
        // Ensure a minimum height so the captured stream has valid dimensions even with 0 tracks
        canvas.height = PIP_PREVIEW_ITEM_HEIGHT * Math.max(1, Math.min(tracks.length, 3));

        document.body.appendChild(canvas);

        canvas.style.display = 'none';

        return canvas;
    }

    /**
     * Create video element for Picture-in-Picture
     */
    private createVideoElement(): HTMLVideoElement {
        const pipVideo = document.createElement('video');
        pipVideo.muted = true;
        pipVideo.autoplay = true;
        document.body.appendChild(pipVideo);

        // In Safari PiP only works with non-hidden videos
        if (isSafari()) {
            pipVideo.style.position = 'absolute';
            pipVideo.style.top = '0';
            pipVideo.style.left = '0';
        } else {
            pipVideo.style.display = 'none';
        }

        pipVideo.disablePictureInPicture = false;

        return pipVideo;
    }

    /**
     * Get canvas stream for Picture-in-Picture
     */
    async getCanvasStream(): Promise<MediaStream> {
        if (!this.canvas) {
            throw new Error('Canvas not initialized');
        }
        return this.canvas.captureStream(30);
    }

    /**
     * Setup video element with canvas stream
     */
    async setupVideoStream(): Promise<void> {
        if (!this.pipVideo || !this.canvas) {
            throw new Error('Video or canvas not initialized');
        }

        const stream = await this.getCanvasStream();
        this.pipVideo.srcObject = stream;
        await this.pipVideo.play();
    }

    /**
     * Request Picture-in-Picture mode
     */
    async requestPictureInPicture(): Promise<void> {
        if (!this.pipVideo) {
            throw new Error('Video element not initialized');
        }
        await this.pipVideo.requestPictureInPicture();
    }

    /**
     * Add event listener for PiP end
     */
    addPiPEndListener(callback: () => void): void {
        if (!this.pipVideo) {
            throw new Error('Video element not initialized');
        }
        this.pipVideo.addEventListener('leavepictureinpicture', callback);
    }

    /**
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement | undefined {
        return this.canvas;
    }

    /**
     * Get video element
     */
    getVideo(): HTMLVideoElement | undefined {
        return this.pipVideo;
    }

    /**
     * Check if session is initialized
     */
    isInitialized(): boolean {
        return !!(this.canvas && this.pipVideo);
    }

    async exitPictureInPicture(): Promise<void> {
        if (document.pictureInPictureElement && document.pictureInPictureElement === this.pipVideo) {
            try {
                await document.exitPictureInPicture();
            } catch (error) {
                // Ignore InvalidStateError - means PiP already closed
                if (error instanceof Error && error.name !== 'InvalidStateError') {
                    // eslint-disable-next-line no-console
                    console.error('Failed to exit Picture-in-Picture:', error);
                }
            }
        }
    }

    /**
     * Destroy all resources and exit PiP mode
     */
    async destroy(): Promise<void> {
        // Exit Picture-in-Picture mode if still active
        // Check both conditions to avoid errors when browser already closed PiP
        if (document.pictureInPictureElement && document.pictureInPictureElement === this.pipVideo) {
            try {
                await document.exitPictureInPicture();
            } catch (error) {
                // Ignore InvalidStateError - means PiP already closed
                // This can happen when browser closes PiP via its native button
                if (error instanceof Error && error.name !== 'InvalidStateError') {
                    // eslint-disable-next-line no-console
                    console.error('Failed to exit Picture-in-Picture:', error);
                }
            }
        }

        // Stop all media tracks
        if (this.pipVideo?.srcObject) {
            const stream = this.pipVideo.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
        }

        // Clean up video element
        if (this.pipVideo) {
            this.pipVideo.pause();
            this.pipVideo.srcObject = null;
            this.pipVideo.remove();
            this.pipVideo = undefined;
        }

        // Clean up canvas element
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = undefined;
        }
    }
}
