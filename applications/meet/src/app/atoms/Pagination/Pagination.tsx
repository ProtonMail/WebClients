import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

interface PaginationProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (newPage: number) => void;
}

export const Pagination = ({ totalPages, currentPage, onPageChange }: PaginationProps) => {
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;
    const pageCounterId = 'pagination-page-counter';
    const displayPage = currentPage + 1;

    return (
        <div className="flex flex-nowrap gap-2 items-center user-select-none text-lg">
            <Button
                shape="ghost"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={isFirstPage}
                icon
                aria-label={c('Action').t`Previous page`}
                aria-controls={pageCounterId}
            >
                <IcChevronLeft aria-hidden="true" />
            </Button>
            <div
                id={pageCounterId}
                aria-label={c('Info').t`Page ${displayPage} of ${totalPages}`}
            >
                {displayPage}/{totalPages}
            </div>
            <Button
                shape="ghost"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={isLastPage}
                icon
                aria-label={c('Action').t`Next page`}
                aria-controls={pageCounterId}
            >
                <IcChevronRight aria-hidden="true" />
            </Button>
        </div>
    );
};
