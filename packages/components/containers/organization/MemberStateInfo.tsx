import type { ReactNode } from 'react';

import { Pill } from '@proton/atoms/Pill/Pill';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

interface Props {
    title: string;
    children: ReactNode;
    backgroundColor?: string;
    color?: string;
}

export const MemberStateInfo = ({ title, children, backgroundColor, color }: Props) => (
    <Tooltip title={title} openDelay={0}>
        <span>
            <Pill className="text-uppercase" rounded="rounded-sm" backgroundColor={backgroundColor} color={color}>
                {children}
            </Pill>
        </span>
    </Tooltip>
);
