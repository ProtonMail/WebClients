import React from 'react';
import { c } from 'ttag';

import { HeaderModal, InnerModal, FooterModal, Button, Alert, PrimaryButton } from 'react-components';

import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import keyAndFileSvgLight from 'design-system/assets/img/pd-images/key-and-files.svg';
import keyAndFileSvgDark from 'design-system/assets/img/pd-images/key-and-files-dark.svg';

interface Props {
    onRecovery: () => void;
    onClose?: () => void;
    recovering?: boolean;
}

const FilesRecoveryState = ({ onRecovery, onClose, recovering }: Props) => {
    const modalTitleID = 'files-recovery-modal';
    const title = c('Title').t`Restore your files`;

    return (
        <>
            <HeaderModal hasClose={!recovering} modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`File recovery process`}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>
                    <div className="p1 flex w100">
                        <img
                            src={getLightOrDark(keyAndFileSvgLight, keyAndFileSvgDark)}
                            alt={title}
                            className="w50 mauto"
                        />
                    </div>
                    <Alert className="mt1 mb1">
                        <div>{c('Info').jt`Would you like to restore your files?`}</div>
                        <div>{c('Info').jt`Recovery process might take some time.`}</div>
                    </Alert>
                </InnerModal>
                <FooterModal>
                    <div className="flex flex-justify-space-between w100 flex-nowrap">
                        <Button disabled={recovering} autoFocus className="min-w7e" onClick={onClose}>{c('Action')
                            .t`Cancel`}</Button>
                        <PrimaryButton loading={recovering} className="min-w7e" onClick={onRecovery}>
                            {c('Action').t`Start recovering`}
                        </PrimaryButton>
                    </div>
                </FooterModal>
            </div>
        </>
    );
};

export default FilesRecoveryState;
