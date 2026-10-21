import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import TextLoader from '@proton/components/components/loader/TextLoader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';

interface Props {
    onClose?: () => void;
}

const StepLoadingImporter = ({ onClose }: Props) => {
    return (
        <ModalTwo open size="large">
            <ModalTwoContent>
                <div className="p-14 text-center w-full" data-testid="StepLoadingImporter:modal">
                    <Loader size="large" className="mb-4" />

                    <h4>{c('Loading info').t`Gathering your data`}</h4>
                    <TextLoader>{c('Loading info').t`We're gathering your data from your provider`}</TextLoader>

                    {onClose && (
                        <Button size="medium" type="button" shape="outline" onClick={onClose}>
                            {c('Action').t`Go back`}
                        </Button>
                    )}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default StepLoadingImporter;
