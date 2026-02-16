import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import noLinksSvg from '@proton/styles/assets/img/illustrations/empty-shared.svg';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';
import { useFileSharingModal } from '../../components/modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';

type Props = {
    shareId?: string;
};

export const EmptySharedByMe: FC<Props> = ({ shareId }) => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    const onShareFile = () => {
        if (shareId) {
            void showFileSharingModal({ shareId, showSharingModal });
        }
    };

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
                    onClick={onShareFile}
                >
                    {c('Action').t`Share file`}
                </Button>
            </div>
            {fileSharingModal}
            {sharingModal}
        </DriveEmptyView>
    );
};
