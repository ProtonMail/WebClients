import type { LucideProps } from 'lucide-react';

import { getProjectLucideIcon } from '../../features/projects/projectIconMapping';
import { LumoIcon } from '../LumoIcon/LumoIcon';

interface ProjectIconProps extends Omit<LucideProps, 'ref' | 'name'> {
    iconId?: string;
}

export const ProjectIcon = ({ iconId, size = 16, color = 'currentColor', ...props }: ProjectIconProps) => {
    return <LumoIcon {...props} name={getProjectLucideIcon(iconId)} size={size} color={color} />;
};
