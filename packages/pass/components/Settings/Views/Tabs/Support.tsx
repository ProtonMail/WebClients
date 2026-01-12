import type { FC } from 'react';

import { Feedback } from '@proton/pass/components/Settings/Feedback';
import { ReportAProblem } from '@proton/pass/components/Settings/ReportAProblem';

export const Support: FC = () => (
    <>
        <ReportAProblem />
        <Feedback />
    </>
);
