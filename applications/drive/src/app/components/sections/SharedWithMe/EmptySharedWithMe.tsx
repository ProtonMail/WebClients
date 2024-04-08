import { c } from 'ttag';

import noLinksSvg from '@proton/styles/assets/img/illustrations/empty-shared-with-me.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';

const EmptyShared = () => {
    return (
        <DriveEmptyView
            image={noLinksSvg}
            title={c('Info').t`Shared with me`}
            subtitle={c('Info').t`Files and folders that others shared with you will appear here`}
            dataTestId="shared-with-me-links-empty-placeholder"
        />
    );
};

export default EmptyShared;
