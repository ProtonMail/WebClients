import { PrivateMainArea, useAppTitle } from '@proton/components';
import { c } from 'ttag';
import SharedLinks from '../../components/sections/SharedLinks/SharedLinks';
import SharedLinksContentProvider from '../../components/sections/SharedLinks/SharedLinksContentProvider';
import SharedLinksToolbar from '../../components/sections/SharedLinks/SharedLinksToolbar';

interface Props {
    shareId: string;
}

const SharedURLsContainerView = ({ shareId }: Props) => {
    useAppTitle(c('Title').t`Shared`);

    return (
        <SharedLinksContentProvider shareId={shareId}>
            <SharedLinksToolbar shareId={shareId} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom">{c('Info').t`My Links`}</div>
                <SharedLinks shareId={shareId} />
            </PrivateMainArea>
        </SharedLinksContentProvider>
    );
};

export default SharedURLsContainerView;
