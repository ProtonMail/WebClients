import SelectAllBanner from 'proton-mail/components/list/select-all/SelectAllBanner';
import { getCanDisplaySelectAllBanner } from 'proton-mail/helpers/selectAll';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { showLabelTaskRunningBanner } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import ListBanners from './MailboxListBanners';
import { useMailboxListContext } from './MailboxListProvider';

interface MailboxListBannersWrapperProps {
    columnLayout: boolean;
    checkedIDs: string[];
    onCheckAll: (check: boolean) => void;
}

const MailboxListBannersWrapper = ({ columnLayout, checkedIDs, onCheckAll }: MailboxListBannersWrapperProps) => {
    const { labelID = '', isESLoading, isSearch, showESSlowToolbar, pageSize, filter } = useMailboxListContext();
    const { selectAllAvailable } = useSelectAll({ labelID });

    const canDisplayTaskRunningBanner = useMailSelector((state) => showLabelTaskRunningBanner(state, { labelID }));

    const hasFilter = Object.keys(filter).length > 0;

    const canShowSelectAllBanner = getCanDisplaySelectAllBanner({
        selectAllFeatureAvailable: selectAllAvailable,
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
                canDisplayTaskRunningBanner={canDisplayTaskRunningBanner}
            />
        </>
    );
};

export default MailboxListBannersWrapper;
