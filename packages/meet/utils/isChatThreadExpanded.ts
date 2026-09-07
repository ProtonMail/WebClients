import type { MeetChatMessage } from '../types/types';

export const isChatThreadExpanded = (rootMessage: Pick<MeetChatMessage, 'expanded'>) => rootMessage.expanded !== false;
