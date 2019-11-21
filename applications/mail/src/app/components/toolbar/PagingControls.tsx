import React from 'react';
import { Icon, DropdownMenu, DropdownMenuButton } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarDropdown from './ToolbarDropdown';
import { PAGE_SIZE } from '../../constants';

import './PagingControls.scss';

interface Props {
    loading: boolean;
    page: number;
    total: number;
    setPage: (page: number) => void;
}

const PagingControls = ({ loading, page, total, setPage }: Props) => {
    const handleNext = () => {
        setPage(page + 1);
    };
    const handlePrevious = () => {
        setPage(page - 1);
    };
    const handlePage = (newPage: number) => () => {
        setPage(newPage);
    };

    const pageCount = Math.floor(total / PAGE_SIZE);

    return (
        <>
            <ToolbarButton
                loading={loading}
                disabled={page <= 0}
                title={c('Action').t`Previous`}
                onClick={handlePrevious}
            >
                <Icon className="toolbar-icon rotateZ-90 mauto" name="caret" />
            </ToolbarButton>
            <ToolbarDropdown
                title={c('Action').t`Change layout`}
                content={page + 1}
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
                disabled={page >= pageCount}
                title={c('Action').t`Next`}
                onClick={handleNext}
            >
                <Icon className="toolbar-icon rotateZ-270 mauto" name="caret" />
            </ToolbarButton>
        </>
    );
};

export default PagingControls;
