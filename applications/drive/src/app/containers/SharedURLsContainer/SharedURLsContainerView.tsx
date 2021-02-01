import React from 'react';
import { PrivateMainArea, Toolbar } from 'react-components';
import { c } from 'ttag';
import SharedLinks from '../../components/SharedLinks/SharedLinks';
import SharedLinksContentProvider from '../../components/SharedLinks/SharedLinksContentProvider';

interface Props {
    shareId: string;
}

const SharedURLsContainerView = ({ shareId }: Props) => {
    return (
        <SharedLinksContentProvider shareId={shareId}>
            <Toolbar />
            <PrivateMainArea hasToolbar className="flex-noMinChildren flex-column flex-nowrap">
                <div className="p1 strong border-bottom">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={shareId} />
            </PrivateMainArea>
        </SharedLinksContentProvider>
    );
};

export default SharedURLsContainerView;
