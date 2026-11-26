import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Pagination from '@proton/components/components/pagination/Pagination';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';

import { REPORTS_PAGE_SIZE } from './usePassReports';

type Props = {
    page: number;
    total: number;
    setPage: (update: (page: number) => number) => void;
    exporting: boolean;
    onExport: () => void;
    upgradeRequired: boolean;
};

export const PassReportFooter: FC<Props> = ({ page, total, setPage, exporting, onExport, upgradeRequired }) => (
    <div className="flex justify-space-between mt-4">
        <Pagination
            page={page}
            total={total ?? 0}
            limit={REPORTS_PAGE_SIZE}
            onSelect={(page: number) => setPage(() => page)}
            onNext={() => setPage((page) => page + 1)}
            onPrevious={() => setPage((page) => page - 1)}
        />
        <Button
            shape="outline"
            loading={exporting}
            onClick={onExport}
            disabled={upgradeRequired}
            title={c('Action').t`Export as CSV`}
        >
            <IcArrowDownLine className="mr-2" />
            {c('Action').t`Export as CSV`}
        </Button>
    </div>
);
