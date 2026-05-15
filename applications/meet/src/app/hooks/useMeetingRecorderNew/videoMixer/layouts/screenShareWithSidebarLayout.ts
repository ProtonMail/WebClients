import { SCREEN_SHARE_PAGE_SIZE } from '@proton/meet/constants';

import { BORDER_RADIUS, GAP, SIDEBAR_WIDTH } from '../constants';
import {
    PROFILE_COLORS,
    drawParticipantBorder,
    drawParticipantName,
    drawParticipantPlaceholder,
    drawVideoFrame,
} from '../worker/drawingPrimitives';
import { type LayoutDrawContext, type RecordingLayout, screenShareKeyFor } from './types';

// Layout used when a participant is sharing their screen and there are also
// camera tiles to display: large screen-share area on the left, a vertical
// sidebar of up to SCREEN_SHARE_PAGE_SIZE camera tiles on the right.
export const screenShareWithSidebarLayout: RecordingLayout = {
    id: 'screenShareWithSidebar',
    matches: (scene) => {
        const hasScreenShare = scene.participants.some((p) => p.isScreenShare);
        const hasRegularParticipants = scene.participants.some((p) => !p.isScreenShare);
        return hasScreenShare && hasRegularParticipants;
    },
    draw: ({ ctx, canvas, scene, videoFrames }: LayoutDrawContext) => {
        const screenShareParticipant = scene.participants.find((p) => p.isScreenShare);
        const regularParticipants = scene.participants.filter((p) => !p.isScreenShare);

        if (!screenShareParticipant) {
            return;
        }

        // Item height excludes the gaps that separate the sidebar tiles.
        const sidebarItemHeight = (canvas.height - GAP * (SCREEN_SHARE_PAGE_SIZE + 1)) / SCREEN_SHARE_PAGE_SIZE;

        const screenShareX = GAP;
        const screenShareY = GAP;
        const screenShareWidth = canvas.width - SIDEBAR_WIDTH - GAP * 2;
        const screenShareHeight = canvas.height - GAP * 2;

        const screenShareBitmap = videoFrames.get(screenShareKeyFor(screenShareParticipant.identity));
        if (screenShareBitmap) {
            drawVideoFrame({
                ctx,
                frame: screenShareBitmap,
                x: screenShareX,
                y: screenShareY,
                width: screenShareWidth,
                height: screenShareHeight,
                objectFit: 'contain',
            });
        }

        drawParticipantName({
            ctx,
            name: `${screenShareParticipant.name} (is presenting)`,
            x: screenShareX,
            y: screenShareY,
            height: screenShareHeight,
        });

        const sidebarX = screenShareX + screenShareWidth + GAP;

        regularParticipants.slice(0, SCREEN_SHARE_PAGE_SIZE).forEach((participant, index) => {
            const xPos = sidebarX;
            const yPos = GAP + index * (sidebarItemHeight + GAP);
            const tileWidth = SIDEBAR_WIDTH - 2 * GAP;
            const tileHeight = sidebarItemHeight;

            const colorIndex = participant.participantIndex % PROFILE_COLORS.length;

            if (participant.hasVideo) {
                const bitmap = videoFrames.get(participant.identity);
                if (bitmap) {
                    drawVideoFrame({
                        ctx,
                        frame: bitmap,
                        x: xPos,
                        y: yPos,
                        width: tileWidth,
                        height: tileHeight,
                        radius: BORDER_RADIUS / 2,
                    });
                }
            } else {
                drawParticipantPlaceholder({
                    ctx,
                    name: participant.name,
                    x: xPos,
                    y: yPos,
                    width: tileWidth,
                    height: tileHeight,
                    colorIndex,
                    radius: BORDER_RADIUS / 2,
                });
            }

            drawParticipantBorder({
                ctx,
                x: xPos,
                y: yPos,
                width: tileWidth,
                height: tileHeight,
                colorIndex,
                isActive: participant.hasActiveAudio,
                radius: BORDER_RADIUS / 2,
            });

            drawParticipantName({
                ctx,
                name: participant.name,
                x: xPos,
                y: yPos,
                height: tileHeight,
            });
        });
    },
};
