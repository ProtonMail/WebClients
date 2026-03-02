import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import noLinksSvg from '@proton/styles/assets/img/illustrations/empty-shared.svg';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';
import { useFileSharingModal } from '../../modals/SelectLinkToShareModal';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';

export const EmptySharedByMe: FC = () => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    return (
        <DriveEmptyView
            image={noLinksSvg}
            title={
                // translator: Shown on empty Shared page
                c('Info').t`Share files with links`
            }
            subtitle={
                // translator: Shown on empty Shared page
                c('Info').t`Create links and share your files with others.`
            }
            dataTestId="shared-links-empty-placeholder"
        >
            <div className="flex justify-center">
                <Button
                    color="norm"
                    size="large"
                    className="text-bold w-custom"
                    style={{ '--w-custom': '13em' }}
                    onClick={() => showFileSharingModal({ showSharingModal })}
                >
                    {c('Action').t`Share file`}
                </Button>
            </div>
            {fileSharingModal}
            {sharingModal}
        </DriveEmptyView>
    );
};
