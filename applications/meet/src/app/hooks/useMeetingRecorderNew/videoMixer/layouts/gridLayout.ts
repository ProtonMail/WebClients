import { BORDER_RADIUS, GAP } from '../constants';
import {
    PROFILE_COLORS,
    drawParticipantBorder,
    drawParticipantName,
    drawParticipantPlaceholder,
    drawVideoFrame,
} from '../worker/drawingPrimitives';
import type { LayoutDrawContext, RecordingLayout } from './types';

// Default layout: an N-by-M grid of camera tiles. Used whenever no participant
// is sharing their screen.
export const gridLayout: RecordingLayout = {
    id: 'grid',
    matches: (scene) => !scene.participants.some((p) => p.isScreenShare),
    draw: ({ ctx, canvas, scene, videoFrames }: LayoutDrawContext) => {
        const { participants, gridLayout: grid } = scene;
        const { cols, rows } = grid;

        if (cols === 0 || rows === 0) {
            return;
        }

        const cellWidth = (canvas.width - GAP * 2) / cols;
        const cellHeight = (canvas.height - GAP * 2) / rows;

        participants.forEach((participant, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            const x = col * cellWidth + GAP;
            const y = row * cellHeight + GAP;
            const tileWidth = cellWidth - GAP;
            const tileHeight = cellHeight - GAP;

            const colorIndex = participant.participantIndex % PROFILE_COLORS.length;

            if (participant.hasVideo) {
                const bitmap = videoFrames.get(participant.identity);
                if (bitmap) {
                    drawVideoFrame({
                        ctx,
                        frame: bitmap,
                        x,
                        y,
                        width: tileWidth,
                        height: tileHeight,
                        radius: BORDER_RADIUS,
                    });
                }
            } else {
                drawParticipantPlaceholder({
                    ctx,
                    name: participant.name,
                    x,
                    y,
                    width: tileWidth,
                    height: tileHeight,
                    colorIndex,
                    radius: BORDER_RADIUS,
                });
            }

            drawParticipantBorder({
                ctx,
                x,
                y,
                width: tileWidth,
                height: tileHeight,
                colorIndex,
                isActive: participant.hasActiveAudio,
                radius: BORDER_RADIUS,
            });

            drawParticipantName({
                ctx,
                name: participant.name,
                x,
                y,
                height: tileHeight,
            });
        });
    },
};
