import { drawParticipantName, drawVideoFrame } from '../worker/drawingPrimitives';
import { type LayoutDrawContext, type RecordingLayout, screenShareKeyFor } from './types';

// Layout used when the only thing being recorded is a screen share — no other
// participant tiles. The screen-share content fills the whole canvas.
export const screenShareSoloLayout: RecordingLayout = {
    id: 'screenShareSolo',
    matches: (scene) => {
        const hasScreenShare = scene.participants.some((p) => p.isScreenShare);
        const hasRegularParticipants = scene.participants.some((p) => !p.isScreenShare);
        return hasScreenShare && !hasRegularParticipants;
    },
    draw: ({ ctx, canvas, scene, videoFrames }: LayoutDrawContext) => {
        const screenShareParticipant = scene.participants.find((p) => p.isScreenShare);

        if (!screenShareParticipant) {
            return;
        }

        const screenShareBitmap = videoFrames.get(screenShareKeyFor(screenShareParticipant.identity));
        if (screenShareBitmap) {
            drawVideoFrame({
                ctx,
                frame: screenShareBitmap,
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height,
                objectFit: 'contain',
            });
        }

        drawParticipantName({
            ctx,
            name: `${screenShareParticipant.name} (is presenting)`,
            x: 0,
            y: 0,
            height: canvas.height,
        });
    },
};
