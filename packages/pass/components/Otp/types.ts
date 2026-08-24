import type { MaybeNull } from '../../types';

export interface IOtpRenderer {
    /** Draws the OTP progress ring for the given percentage of the period */
    draw: (percent: number, period: number) => void;
    /** Draws from source canvas with updated countdown value */
    drawFrom: (countdown: number, canvas: HTMLCanvasElement) => void;
    /** Returns the underlying canvas element */
    getCanvas: () => MaybeNull<HTMLCanvasElement>;
}
