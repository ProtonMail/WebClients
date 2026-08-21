import { useParticipantAttributes, useRoomContext } from '@livekit/components-react';

import { useStableCallback } from './useStableCallback';

/** LiveKit removes an attribute set to an empty string, so that is how callers unset one. */
export const useLocalParticipantAttribute = (name: string) => {
    const room = useRoomContext();

    const { attributes } = useParticipantAttributes({ participant: room?.localParticipant });

    const setValue = useStableCallback(async (next: string) => {
        if (!room) {
            return;
        }

        await room.localParticipant.setAttributes({ [name]: next });
    });

    return { value: attributes?.[name] ?? '', setValue };
};
