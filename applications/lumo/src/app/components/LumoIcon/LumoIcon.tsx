import type { LucideProps } from 'lucide-react';
import { icons } from 'lucide-react';

export type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
    name: IconName;
}

export function LumoIcon({ name, size = 16, color = 'currentColor', ...props }: IconProps) {
    const LucideIcon = icons[name];

    if (!LucideIcon) {
        console.warn(`Icon "${name}" not found in Lucide`);
        return null;
    }

    return <LucideIcon size={size} color={color} {...props} />;
}
