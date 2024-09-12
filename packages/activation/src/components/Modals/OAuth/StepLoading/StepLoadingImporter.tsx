import { c } from 'ttag';

import { Loader, ModalTwo, ModalTwoContent, TextLoader } from '@proton/components';

const StepLoadingImporter = () => {
    return (
        <ModalTwo open size="large">
            <ModalTwoContent>
                <div className="p-14 text-center w-full" data-testid="StepLoadingImporter:modal">
                    <Loader size="large" className="mb-4" />

                    <h4>{c('Loading info').t`Gathering your data`}</h4>
                    <TextLoader>{c('Loading info').t`We're gathering your data from your provider`}</TextLoader>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default StepLoadingImporter;
