import { c } from 'ttag';

import { EmptyViewContainer, PrimaryButton } from '@proton/components';
import noLinksSvg from '@proton/styles/assets/img/illustrations/file-share.svg';

import { useFileSharingModal } from '../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

type Props = {
    shareId: string;
};

const EmptyShared = ({ shareId }: Props) => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const onShareFile = () => {
        if (shareId) {
            void showFileSharingModal({ shareId, showLinkSharingModal });
        }
    };

    return (
        <div role="presentation" className="flex w-full flex flex-item-fluid overflow-auto">
            <EmptyViewContainer
                imageProps={{ src: noLinksSvg, title: c('Info').t`Share files with links` }}
                data-testid="shared-links-empty-placeholder"
            >
                <h3 className="text-bold">{c('Info').t`Share files with links`}</h3>
                <p>{c('Info').t`Create links and share your files with others.`}</p>
                <div className="flex flex-justify-center">
                    <PrimaryButton
                        size="large"
                        className="text-bold w-custom"
                        style={{ '--w-custom': '13em' }}
                        onClick={onShareFile}
                    >
                        {c('Action').t`Share file`}
                    </PrimaryButton>
                </div>
            </EmptyViewContainer>
            {fileSharingModal}
            {linkSharingModal}
        </div>
    );
};

export default EmptyShared;
