import React from 'react';
import { Icon, DropdownMenu, DropdownMenuButton } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarDropdown from './ToolbarDropdown';

import { Page } from '../../models/tools';
import { usePaging } from '../../hooks/usePaging';

interface Props {
    loading: boolean;
    page: Page;
    onPage: (page: number) => void;
}

const PagingControls = ({ loading, page: inputPage, onPage: inputOnPage }: Props) => {
    const { onPrevious, onNext, onPage, page, total } = usePaging(inputPage, inputOnPage);

    return (
        <>
            <ToolbarButton
                loading={loading}
                disabled={page <= 1}
                title={c('Action').t`Previous page`}
                onClick={onPrevious}
                className="notablet nomobile"
            >
                <Icon className="toolbar-icon rotateZ-90 mauto" name="caret" />
                <span className="sr-only">{c('Action').t`Previous page`}</span>
            </ToolbarButton>
            <ToolbarDropdown
                title={c('Action').t`Change page`}
                content={String(page)}
                disabled={total <= 1}
                size="narrow"
            >
                {() => (
                    <DropdownMenu>
                        {[...Array(total)].map((_, i) => {
                            const pageNumber = i + 1; // paging tooling is 0 based
                            return (
                                <DropdownMenuButton
                                    key={i} // eslint-disable-line react/no-array-index-key
                                    loading={loading}
                                    disabled={page - 1 === i}
                                    onClick={() => onPage(i + 1)}
                                    aria-label={c('Action').t`Page ${pageNumber}`}
                                >
                                    {pageNumber}
                                </DropdownMenuButton>
                            );
                        })}
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <ToolbarButton
                loading={loading}
                disabled={page >= total}
                title={c('Action').t`Next page`}
                onClick={onNext}
                className="notablet nomobile"
            >
                <Icon className="toolbar-icon rotateZ-270 mauto" name="caret" />
                <span className="sr-only">{c('Action').t`Next page`}</span>
            </ToolbarButton>
        </>
    );
};

export default PagingControls;
