import { ReactNode } from 'react';

import GetStartedChecklistProvider from './GetStartedChecklistProvider';

interface Props {
    children: ReactNode;
}

const ChecklistsProvider = ({ children }: Props) => {
    return <GetStartedChecklistProvider>{children}</GetStartedChecklistProvider>;
};

export default ChecklistsProvider;
