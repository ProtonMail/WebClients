import React from 'react';
import { Icon, DropdownMenu, DropdownMenuButton } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarDropdown from './ToolbarDropdown';

import { Page } from '../../models/tools';
import { pageCount } from '../../helpers/paging';

interface Props {
    loading: boolean;
    page: Page;
    onPage: (page: number) => void;
}

const PagingControls = ({ loading, page, onPage }: Props) => {
    const setPage = (pageNumber: number) => onPage(pageNumber);
    const handleNext = () => setPage(page.page + 1);
    const handlePrevious = () => setPage(page.page - 1);
    const handlePage = (newPage: number) => () => setPage(newPage);
    const count = pageCount(page);

    return (
        <>
            <ToolbarButton
                loading={loading}
                disabled={page.page <= 0}
                title={c('Action').t`Previous`}
                onClick={handlePrevious}
                className="notablet nomobile"
            >
                <Icon className="toolbar-icon rotateZ-90 mauto" name="caret" />
            </ToolbarButton>
            <ToolbarDropdown
                title={c('Action').t`Change page`}
                content={String(page.page + 1)}
                disabled={count <= 1}
                size="narrow"
            >
                {() => (
                    <DropdownMenu>
                        {[...Array(count)].map((_, i) => (
                            <DropdownMenuButton
                                key={i}
                                loading={loading}
                                disabled={page.page === i}
                                onClick={handlePage(i)}
                            >
                                {i + 1}
                            </DropdownMenuButton>
                        ))}
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <ToolbarButton
                loading={loading}
                disabled={page.page >= count - 1}
                title={c('Action').t`Next`}
                onClick={handleNext}
                className="notablet nomobile"
            >
                <Icon className="toolbar-icon rotateZ-270 mauto" name="caret" />
            </ToolbarButton>
        </>
    );
};

export default PagingControls;
