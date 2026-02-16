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

    return (
        <div className="flex flex-nowrap gap-2 items-center user-select-none text-lg">
            <Button shape="ghost" onClick={() => onPageChange(currentPage - 1)} disabled={isFirstPage} icon>
                <IcChevronLeft alt={c('Action').t`Previous page`} />
            </Button>
            <div>
                {currentPage + 1}/{totalPages}
            </div>
            <Button shape="ghost" onClick={() => onPageChange(currentPage + 1)} disabled={isLastPage} icon>
                <IcChevronRight alt={c('Action').t`Next page`} />
            </Button>
        </div>
    );
};
