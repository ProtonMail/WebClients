import React from 'react';
import { c } from 'ttag';

import { IllustrationPlaceholder, PrimaryButton, useModals } from 'react-components';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import noLinksSvgLight from 'design-system/assets/img/pd-images/no-sharing-link.svg';
import noLinksSvgDark from 'design-system/assets/img/pd-images/no-sharing-link-dark.svg';

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
            <IllustrationPlaceholder
                className="w20"
                url={getLightOrDark(noLinksSvgLight, noLinksSvgDark)}
                title={c('Info').t`Share files with links`}
            >
                <p className="m0">{c('Info').t`Create links and share your files with others.`}</p>
                <div className="mt2 flex flex-column flex-nowrap w200p flex-item-noshrink">
                    <PrimaryButton className="pm-button--large bold mt0-25 w100" onClick={onShareFile}>
                        {c('Action').t`Share file`}
                    </PrimaryButton>
                </div>
            </IllustrationPlaceholder>
        </div>
    );
};

export default EmptyShared;
