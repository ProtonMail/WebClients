import React from 'react';
import { Icon, DropdownMenu, DropdownMenuButton } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarDropdown from './ToolbarDropdown';

import './PagingControls.scss';
import { Page } from '../../models/tools';

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
    const pageCount = Math.floor(page.total / page.size);

    return (
        <>
            <ToolbarButton
                loading={loading}
                disabled={page.page <= 0}
                title={c('Action').t`Previous`}
                onClick={handlePrevious}
            >
                <Icon className="toolbar-icon rotateZ-90 mauto" name="caret" />
            </ToolbarButton>
            <ToolbarDropdown
                title={c('Action').t`Change layout`}
                content={page.page + 1}
                className="paging-dropdown"
                size="narrow"
            >
                <DropdownMenu>
                    {[...Array(pageCount)].map((_, i) => (
                        <DropdownMenuButton loading={loading} key={i} onClick={handlePage(i)}>
                            {i + 1}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </ToolbarDropdown>
            <ToolbarButton
                loading={loading}
                disabled={page.page >= pageCount}
                title={c('Action').t`Next`}
                onClick={handleNext}
            >
                <Icon className="toolbar-icon rotateZ-270 mauto" name="caret" />
            </ToolbarButton>
        </>
    );
};

export default PagingControls;
