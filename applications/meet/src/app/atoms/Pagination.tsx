import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcChevronLeft, IcChevronRight } from '@proton/icons';

interface PaginationProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (newPage: (currentPage: number) => number) => void;
}

export const Pagination = ({ totalPages, currentPage, onPageChange }: PaginationProps) => {
    return (
        <div className="flex flex-nowrap gap-2 items-center">
            <Button shape="ghost" onClick={() => onPageChange((currentPage) => currentPage - 1)}>
                <IcChevronLeft alt={c('Meet').t`Previous page`} />
            </Button>
            <div>
                {currentPage + 1}/{totalPages}
            </div>
            <Button shape="ghost" onClick={() => onPageChange((currentPage) => currentPage + 1)}>
                <IcChevronRight alt={c('Meet').t`Next page`} />
            </Button>
        </div>
    );
};
