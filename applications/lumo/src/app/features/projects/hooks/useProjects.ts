import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachmentCountsBySpaceId, selectConversationCountsBySpaceId } from '../../../redux/selectors';
import { selectSpaceMap } from '../../../redux/slices/core/spaces';
import { SpaceType } from '../../../types';
import type { Project } from '../types';

/**
 * Hook to get all projects from the spaces in Redux state
 * Projects are spaces with spaceType SpaceType.Project
 */
export const useProjects = () => {
    const spaces = useLumoSelector(selectSpaceMap);
    const conversationCounts = useLumoSelector(selectConversationCountsBySpaceId, shallowEqual);
    const attachmentCounts = useLumoSelector(selectAttachmentCountsBySpaceId, shallowEqual);

    return useMemo(() => {
        const projectList: Project[] = [];

        Object.values(spaces).forEach((space) => {
            if (space.spaceType === SpaceType.Project) {
                projectList.push({
                    id: space.id,
                    // translator: Fallback title for a project without a name.
                    name: space.projectName || c('collider_2025:Title').t`Untitled Project`,
                    description: space.projectInstructions,
                    icon: space.projectIcon,
                    spaceId: space.id,
                    createdAt: space.createdAt,
                    conversationCount: conversationCounts[space.id] ?? 0,
                    fileCount: attachmentCounts[space.id] ?? 0,
                    isExample: false,
                });
            }
        });

        return projectList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [spaces, conversationCounts, attachmentCounts]);
};
