import { c } from 'ttag';

import { Button } from '@proton/atoms';
import noAccessSvg from '@proton/styles/assets/img/illustrations/no-access.svg';

import { DriveEmptyView } from '../../../components/layout/DriveEmptyView';
import useDriveNavigation from '../../../hooks/drive/useNavigate';

export const NoAccessView = () => {
    const { navigateToRoot } = useDriveNavigation();
    return (
        <DriveEmptyView
            image={noAccessSvg}
            title={c('Info').t`You need access`}
            subtitle={c('Info').t`Request access, or switch to an account with access.`}
            dataTestId="no-access-placeholder"
        >
            <Button onClick={() => navigateToRoot()}>{c('Action').t`Go to my files`}</Button>
        </DriveEmptyView>
    );
};
