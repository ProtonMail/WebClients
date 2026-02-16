import type { LogLevel, Room } from 'livekit-client';

import { isLiveKitLogAllowedToSend, redactLogs } from './liveKitLogging';

export class LiveKitLogCollector {
    room: Room;

    constructor(room: Room) {
        this.room = room;
    }

    private logs: { level: LogLevel; message: string; room: string; localParticipant: string; context: string }[] = [];

    public addLog = (level: LogLevel, msg: string, context?: object) => {
        const { msg: sanitizedMsg, context: sanitizedContext } = redactLogs(msg, context);
        if (isLiveKitLogAllowedToSend(level, sanitizedMsg, sanitizedContext)) {
            this.logs.push({
                level,
                message: `[LiveKit][${this.room.name}][${this.room.localParticipant?.identity}] - ${sanitizedMsg}`,
                room: this.room.name,
                localParticipant: this.room.localParticipant?.identity,
                context: JSON.stringify(sanitizedContext),
            });
        }
    };

    public getLogs() {
        return this.logs;
    }
}
