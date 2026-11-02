import type { LumoUserSettings } from '../../../redux/slices/lumoUserSettingsTypes';
import { type ChatSearchReach, type Space, SpaceType } from '../../../types';

export type SearchReach = {
    chatSearch: ChatSearchReach;
    searchOtherSpaces: boolean;
};

/**
 * How far knowledge lookup may reach from a chat: the project's choice, else the user's, else off.
 * Outside a project there are no project chats to search, so "project" means none.
 */
export function resolveSearchReach(
    settings: Pick<LumoUserSettings, 'conversationSearch' | 'isCrossProjectSearchEnabled'>,
    space: Space | undefined
): SearchReach {
    const project = space?.spaceType === SpaceType.Project ? space : undefined;
    const chatSearch = project?.chatSearch ?? settings.conversationSearch ?? 'none';
    return {
        chatSearch: !project && chatSearch === 'project' ? 'none' : chatSearch,
        searchOtherSpaces: project?.searchOtherProjects ?? settings.isCrossProjectSearchEnabled ?? false,
    };
}

/** Whether chats outside this space may search its chats and files. Only projects can be private. */
export function isOpenToOtherSpaces(space: Space | undefined): boolean {
    return space?.spaceType !== SpaceType.Project || space.isPrivate !== true;
}
