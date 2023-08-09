import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const QuickSettingsSectionHeadline = ({ children }: Props) => {
    return <h3 className="flex-item-fluid text-rg text-bold mt-1">{children}</h3>;
};

export default QuickSettingsSectionHeadline;
