import type { FC } from 'react';

import { c } from 'ttag';

import { PrimaryButton } from '@proton/components';
import noLinksSvg from '@proton/styles/assets/img/illustrations/empty-shared.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';
import { useFileSharingModal } from '../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

type Props = {
    shareId?: string;
};

const EmptyShared: FC<Props> = ({ shareId }) => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const onShareFile = () => {
        if (shareId) {
            void showFileSharingModal({ shareId, showLinkSharingModal });
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
                <PrimaryButton
                    size="large"
                    className="text-bold w-custom"
                    style={{ '--w-custom': '13em' }}
                    onClick={onShareFile}
                >
                    {c('Action').t`Share file`}
                </PrimaryButton>
            </div>
            {fileSharingModal}
            {linkSharingModal}
        </DriveEmptyView>
    );
};

export default EmptyShared;
