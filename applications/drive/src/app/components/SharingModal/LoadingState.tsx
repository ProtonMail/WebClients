import React from 'react';
import { InnerModal, Loader, TextLoader } from '@proton/components';
import { c } from 'ttag';

interface Props {
    generated: boolean;
}

function LoadingState({ generated }: Props) {
    return (
        <div className="modal-content pt2 pb2">
            <InnerModal className="mt2 mb2">
                <div className="flex flex-column flex-align-items-center">
                    <Loader size="medium" className="mt1 mb1" />
                    <TextLoader className="m0">
                        {generated ? c('Info').t`Preparing link to file` : c('Info').t`Creating link to file`}
                    </TextLoader>
                </div>
            </InnerModal>
        </div>
    );
}

export default LoadingState;
