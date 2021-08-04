import { c } from 'ttag';

import { IllustrationPlaceholder, PrimaryButton, useModals } from '@proton/components';

import noLinksSvg from '@proton/styles/assets/img/placeholders/file-share.svg';

import SelectedFileToShareModal from '../SelectedFileToShareModal';

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
        <div role="presentation" className="p2 mt2 flex w100 flex flex-item-fluid">
            <IllustrationPlaceholder className="w20" url={noLinksSvg} title={c('Info').t`Share files with links`}>
                <p className="m0">{c('Info').t`Create links and share your files with others.`}</p>
                <div className="mt2 flex flex-column flex-nowrap w13e flex-item-noshrink">
                    <PrimaryButton size="large" className="text-bold mt0-25 w100" onClick={onShareFile}>
                        {c('Action').t`Share file`}
                    </PrimaryButton>
                </div>
            </IllustrationPlaceholder>
        </div>
    );
};

export default EmptyShared;
