import React from 'react';

import { showLabelTaskRunningBanner } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import ListBanners from './MailboxListBanners';
import { useMailboxListContext } from './MailboxListProvider';

interface MailboxListBannersWrapperProps {
    columnLayout: boolean;
}

const MailboxListBannersWrapper = ({ columnLayout }: MailboxListBannersWrapperProps) => {
    const { labelID = '', isESLoading, isSearch, showESSlowToolbar } = useMailboxListContext();

    const canDisplayTaskRunningBanner = useMailSelector((state) => showLabelTaskRunningBanner(state, { labelID }));

    return (
        <ListBanners
            labelID={labelID}
            columnLayout={columnLayout}
            esState={{ isESLoading, isSearch, showESSlowToolbar }}
            canDisplayTaskRunningBanner={canDisplayTaskRunningBanner}
        />
    );
};

export default MailboxListBannersWrapper;
