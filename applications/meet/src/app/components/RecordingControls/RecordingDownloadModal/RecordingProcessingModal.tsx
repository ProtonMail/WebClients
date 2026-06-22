import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';

import '../../ConfirmationModal/ConfirmationModal.scss';

export const RecordingProcessingModal = () => {
    return (
        <ModalTwo
            open={true}
            rootClassName="confirmation-modal"
            size="small"
            className="large-meet-radius border border-norm overflow-y-auto"
        >
            <div
                className="flex flex-column flex-nowrap justify-center items-center gap-4 text-center h-full p-6 overflow-hidden min-h-custom"
                style={{ '--min-h-custom': '22rem' }}
            >
                <CircleLoader size="large" />
                <div className="text-3xl text-semibold">{c('Title').t`Preparing your recording…`}</div>
            </div>
        </ModalTwo>
    );
};
