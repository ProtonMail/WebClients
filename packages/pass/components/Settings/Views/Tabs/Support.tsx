import type { FC } from 'react';

import { Feedback } from '../../Feedback';
import { ReportAProblem } from '../../ReportAProblem';

export const Support: FC = () => (
    <>
        <ReportAProblem />
        <Feedback />
    </>
);
