import * as React from 'react';
import { InnerModal, Loader, TextLoader } from '@proton/components';

const ModalContentLoader: React.FunctionComponent = ({ children }) => {
    return (
        <div className="modal-content pt2 pb2">
            <InnerModal className="mt2 mb2">
                <div className="flex flex-column flex-align-items-center">
                    <Loader size="medium" className="mt1 mb1" />
                    <TextLoader className="m0">{children}</TextLoader>
                </div>
            </InnerModal>
        </div>
    );
};

export default ModalContentLoader;
