import React from 'react';

import ListPagination from './MailboxListPagination';
import { useMailboxListContext } from './MailboxListProvider';

const ListPaginationWrapper = () => {
    const { page, total, handlePrevious, handleNext, mailboxListLoading, handlePage } = useMailboxListContext();

    if (total <= 1) {
        return null;
    }

    return (
        <div className="p-5 flex flex-column items-center shrink-0">
            <ListPagination
                page={page}
                total={total}
                handlePage={handlePage}
                handlePrevious={handlePrevious}
                handleNext={handleNext}
                loading={mailboxListLoading}
            />
        </div>
    );
};

export default ListPaginationWrapper;
