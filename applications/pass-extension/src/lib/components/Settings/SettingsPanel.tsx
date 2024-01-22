import type { FC, ReactNode } from 'react';

import { Card } from '@proton/atoms/Card';

type Props = {
    title: string;
    subTitle?: string;
    children: ReactNode;
};
export const SettingsPanel: FC<Props> = ({ title, subTitle, children }) => (
    <Card rounded className="mb-4 p-3 relative">
        <strong className="color-norm block mb-1">{title}</strong>
        {subTitle && <em className="block text-sm color-weak mb-2">{subTitle}</em>}

        <hr className="mt-2 mb-4 border-weak" />
        {children}
    </Card>
);
