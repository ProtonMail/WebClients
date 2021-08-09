import { c } from 'ttag';

import { PrimaryButton, useModals, EmptyViewContainer } from '@proton/components';

import noLinksSvg from '@proton/styles/assets/img/placeholders/file-share.svg';

import SelectedFileToShareModal from '../../SelectedFileToShareModal/SelectedFileToShareModal';

type Props = {
    shareId: string;
};

const EmptyShared = ({ shareId }: Props) => {
    const { createModal } = useModals();

    const onShareFile = () => {
        if (shareId) {
            createModal(<SelectedFileToShareModal shareId={shareId} />);
        }
    };

    return (
        <EmptyViewContainer imageProps={{ src: noLinksSvg, title: c('Info').t`Share files with links` }}>
            <h3 className="text-bold">{c('Info').t`Share files with links`}</h3>
            <p>{c('Info').t`Create links and share your files with others.`}</p>
            <div className="flex flex-justify-center">
                <PrimaryButton size="large" className="text-bold w13e" onClick={onShareFile}>
                    {c('Action').t`Share file`}
                </PrimaryButton>
            </div>
        </EmptyViewContainer>
    );
};

export default EmptyShared;
