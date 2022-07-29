import { ReactNode } from 'react';

import GetStartedChecklistProvider from './GetStartedChecklistProvider';
import PaidUserChecklistProvider from './PaidUserChecklistProvider';

interface Props {
    children: ReactNode;
}

const ChecklistsProvider = ({ children }: Props) => {
    return (
        <GetStartedChecklistProvider>
            <PaidUserChecklistProvider>{children}</PaidUserChecklistProvider>
        </GetStartedChecklistProvider>
    );
};

export default ChecklistsProvider;
