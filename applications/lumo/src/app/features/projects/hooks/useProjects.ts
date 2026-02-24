import {useMemo} from 'react';

import {useLumoSelector} from '../../../redux/hooks';
import {selectAttachments, selectConversations} from '../../../redux/selectors';
import {selectSpaceMap} from '../../../redux/slices/core/spaces';
import type {Project} from '../types';

/**
 * Hook to get all projects from the spaces in Redux state
 * Projects are spaces with the isProject flag set to true
 */
export const useProjects = () => {
    const spaces = useLumoSelector(selectSpaceMap);
    const conversations = useLumoSelector(selectConversations);
    const attachments = useLumoSelector(selectAttachments);

    return useMemo(() => {
        const projectList: Project[] = [];

        Object.values(spaces).forEach((space) => {
            // Only include spaces that are marked as projects
            if (space.isProject) {
                // Count conversations belonging to this space
                const conversationCount = Object.values(conversations).filter(
                    (conv) => conv.spaceId === space.id
                ).length;

                // Count attachments (persistent project files) belonging to this space
                const fileCount = Object.values(attachments).filter(
                    (attachment) => attachment.spaceId === space.id && !attachment.error && !attachment.processing
                ).length;

                projectList.push({
                    id: space.id,
                    name: space.projectName || 'Untitled Project',
                    description: space.projectInstructions,
                    icon: space.projectIcon,
                    spaceId: space.id,
                    createdAt: space.createdAt,
                    conversationCount,
                    fileCount,
                    isExample: false,
                });
            }
        });

        // Sort by creation date, newest first
        return projectList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [spaces, conversations, attachments]);
};
