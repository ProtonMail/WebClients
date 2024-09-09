import type { ReactNode } from 'react';

import { Loader, ModalTwoContent, TextLoader } from '@proton/components';

const ModalContentLoader = ({ children }: { children: ReactNode }) => {
    return (
        <div className="modal-content py-7">
            <ModalTwoContent className="my-8">
                <div className="flex flex-column items-center">
                    <Loader size="medium" className="my-4" />
                    <TextLoader className="m-0">{children}</TextLoader>
                </div>
            </ModalTwoContent>
        </div>
    );
};

export default ModalContentLoader;
