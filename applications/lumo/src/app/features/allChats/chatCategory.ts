import type { IconName } from '../../components/LumoIcon/LumoIcon';
import { getProjectLucideIcon } from '../projects/projectIconMapping';

interface DeriveChatRowIconInput {
    projectIcon?: string;
    isProject: boolean;
    hasImages: boolean;
}

export const deriveChatRowIcon = ({ projectIcon, isProject, hasImages }: DeriveChatRowIconInput): IconName => {
    if (isProject && projectIcon) {
        return getProjectLucideIcon(projectIcon);
    }

    if (hasImages) {
        return 'Image';
    }

    return 'MessageCircle';
};
