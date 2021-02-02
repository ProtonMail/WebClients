import React from 'react';
import { PrivateMainArea } from 'react-components';
import { c } from 'ttag';
import SharedLinks from '../../components/SharedLinks/SharedLinks';
import SharedLinksContentProvider from '../../components/SharedLinks/SharedLinksContentProvider';
import SharedLinksToolbar from '../../components/SharedLinks/SharedLinksToolbar';

interface Props {
    shareId: string;
}

const SharedURLsContainerView = ({ shareId }: Props) => {
    return (
        <SharedLinksContentProvider shareId={shareId}>
            <SharedLinksToolbar shareId={shareId} />
            <PrivateMainArea hasToolbar className="flex-noMinChildren flex-column flex-nowrap">
                <div className="p1 strong border-bottom">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={shareId} />
            </PrivateMainArea>
        </SharedLinksContentProvider>
    );
};

export default SharedURLsContainerView;
