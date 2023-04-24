import * as React from 'react';

import { Loader, ModalTwoContent, TextLoader } from '@proton/components';

const ModalContentLoader: React.FunctionComponent = ({ children }) => {
    return (
        <div className="modal-content pt2 pb2">
            <ModalTwoContent className="mt2 mb2">
                <div className="flex flex-column flex-align-items-center">
                    <Loader size="medium" className="mt1 mb1" />
                    <TextLoader className="m-0">{children}</TextLoader>
                </div>
            </ModalTwoContent>
        </div>
    );
};

export default ModalContentLoader;
