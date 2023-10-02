import { memo, useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components/components';
import { useFlag } from '@proton/components/containers';
import { PageSizeSelector } from '@proton/components/containers/messages/PageSizeSelector';
import { useMailSettings } from '@proton/components/hooks';
import { VIEW_MODE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

interface Props {
    onPrevious: () => void;
    onNext: () => void;
    onPage: (pageNumber: number) => void;
    page: number;
    total: number;
    disabled?: boolean;
}

const ListPagination = ({ onPrevious, onNext, onPage, page, disabled, total }: Props) => {
    const isPageSizeSettingEnabled = useFlag('WebMailPageSizeSetting');

    const [{ ViewMode = VIEW_MODE.GROUP } = {}] = useMailSettings();
    const goToPageTitle = (page: number) => c('Action').t`Go to page ${page}`;
    const disablePrevious = page === 1;
    const disableNext = page === total;

    const pageNumbersToDisplay: number[] = useMemo(() => {
        const lastPage = total;

        switch (page) {
            case 1:
                /**
                 * We display buttons for 3 first pages and last one
                 */
                return unique([1, page + 1, Math.min(page + 2, lastPage), lastPage]);
            case lastPage:
                /**
                 * We display buttons for first page and 3 last pages
                 */
                return unique([1, Math.max(1, lastPage - 2), lastPage - 1, lastPage]);
            default:
                /**
                 * We display buttons for first, last, current-1, current and current+1 pages
                 */
                return unique([1, page - 1, page, page + 1, lastPage]);
        }
    }, [page, total]);

    return (
        <div className="flex flex-column flex-align-items-center">
            <div className="flex flex-row gap-2 flex-align-items-inherit">
                <Tooltip title={c('Action').t`Go to previous page`}>
                    <Button
                        size="small"
                        icon
                        shape="ghost"
                        className="on-rtl-mirror"
                        disabled={disabled || disablePrevious}
                        onClick={() => onPrevious()}
                        data-testid="pagination-row:go-to-previous-page"
                    >
                        <Icon name="chevron-left" className="block" alt={c('Action').t`Go to previous page`} />
                    </Button>
                </Tooltip>
                {pageNumbersToDisplay.reduce((acc: React.JSX.Element[], pageNumber: number, index: number) => {
                    const isActive = pageNumber === page;
                    const needsEllispsis = index > 0 && pageNumber - pageNumbersToDisplay[index - 1] > 1;
                    const buttonTitle = goToPageTitle(pageNumber);

                    return [
                        ...acc,
                        needsEllispsis && <div key={`pagination_ellipsis_${pageNumber}`}>...</div>,
                        <Tooltip key={`pagination_${pageNumber}`} title={buttonTitle}>
                            <Button
                                size="small"
                                aria-current={isActive}
                                shape={isActive ? 'solid' : 'ghost'}
                                className={clsx([isActive && 'text-bold no-pointer-events', 'px-2'])}
                                disabled={disabled}
                                onClick={() => onPage(pageNumber)}
                                data-testid={`pagination-row:go-to-page-${pageNumber}`}
                            >
                                <span className="sr-only">{buttonTitle}</span>
                                <span aria-hidden="true">{pageNumber}</span>
                            </Button>
                        </Tooltip>,
                    ].filter(isTruthy);
                }, [])}
                <Tooltip title={c('Action').t`Go to next page`}>
                    <Button
                        size="small"
                        shape="ghost"
                        className="on-rtl-mirror"
                        icon
                        disabled={disabled || disableNext}
                        onClick={() => onNext()}
                        data-testid="pagination-row:go-to-next-page"
                    >
                        <Icon name="chevron-right" className="block" alt={c('Action').t`Go to next page`} />
                    </Button>
                </Tooltip>
            </div>

            {isPageSizeSettingEnabled && (
                <div className="flex flex-row flex-align-items-center mt-3">
                    <label htmlFor="pageSizeSelector">
                        <span className="color-weak mr-2">
                            {ViewMode === VIEW_MODE.GROUP
                                ? c('Label').t`Conversations per page`
                                : c('Label').t`Messages per page`}
                        </span>
                    </label>

                    <PageSizeSelector id="pageSizeSelector" />
                </div>
            )}
        </div>
    );
};

export default memo(ListPagination);
