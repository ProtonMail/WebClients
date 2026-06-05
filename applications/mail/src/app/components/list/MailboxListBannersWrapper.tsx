import SelectAllBanner from 'proton-mail/components/list/select-all/SelectAllBanner';
import { getCanDisplaySelectAllBanner } from 'proton-mail/helpers/selectAll';

import {
    pageSize as pageSizeSelector,
    selectFilter,
    selectLabelID,
    selectisSearching,
    taskRunningInLabel,
} from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import ListBanners from './MailboxListBanners';
import { useMailboxListContext } from './MailboxListProvider';

interface MailboxListBannersWrapperProps {
    columnLayout: boolean;
    checkedIDs: string[];
    onCheckAll: (check: boolean) => void;
}

const MailboxListBannersWrapper = ({ columnLayout, checkedIDs, onCheckAll }: MailboxListBannersWrapperProps) => {
    const isSearch = useMailSelector(selectisSearching);
    const labelID = useMailSelector(selectLabelID);
    const filter = useMailSelector(selectFilter);
    const pageSize = useMailSelector(pageSizeSelector);
    const { isESLoading, showESSlowToolbar } = useMailboxListContext();

    const taskIsRunningInLabel = useMailSelector((state) => taskRunningInLabel(state, { labelID }));

    const hasFilter = Object.keys(filter).length > 0;

    const canShowSelectAllBanner = getCanDisplaySelectAllBanner({
        mailPageSize: pageSize,
        checkedIDs,
        labelID,
        isSearch,
        hasFilter,
    });

    return (
        <>
            {canShowSelectAllBanner && (
                <div className="shrink-0">
                    <SelectAllBanner labelID={labelID} onCheckAll={onCheckAll} />
                </div>
            )}

            <ListBanners
                labelID={labelID}
                columnLayout={columnLayout}
                esState={{ isESLoading, isSearch, showESSlowToolbar }}
                canDisplayTaskRunningBanner={!!taskIsRunningInLabel}
            />
        </>
    );
};

export default MailboxListBannersWrapper;
