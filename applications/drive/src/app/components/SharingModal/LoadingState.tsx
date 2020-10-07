import React from 'react';
import { InnerModal, Loader, TextLoader } from 'react-components';
import { c } from 'ttag';

interface Props {
    generated: boolean;
}

function LoadingState({ generated }: Props) {
    return (
        <div className="pm-modalContent pt2 pb2">
            <InnerModal className="mt2 mb2">
                <div className="flex flex-column flex-items-center">
                    <Loader size="medium" className="mt1 mb1" />
                    <TextLoader className="m0">
                        {generated ? c('Info').t`Preparing secure link` : c('Info').t`Generating secure link`}
                    </TextLoader>
                </div>
            </InnerModal>
        </div>
    );
}

export default LoadingState;
