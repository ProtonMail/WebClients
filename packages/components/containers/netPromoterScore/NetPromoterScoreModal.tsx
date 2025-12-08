import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { dismissNps } from '@proton/shared/lib/api/netPromoterScore';

import ScaleLadder from '../../components/input/ScaleLadder';
import Modal from '../../components/modalTwo/Modal';
import ModalContent from '../../components/modalTwo/ModalContent';
import ModalFooter from '../../components/modalTwo/ModalFooter';
import ModalHeader from '../../components/modalTwo/ModalHeader';
import InputFieldTwo from '../../components/v2/field/InputField';
import TextAreaTwo from '../../components/v2/input/TextArea';
import useApi from '../../hooks/useApi';
import type { NetPromoterScoreModalProps } from './interface';

export const NetPromoterScoreModal = ({ show, config }: NetPromoterScoreModalProps) => {
    // TODO: add telemetry
    // TODO: add feedback submit handler
    const [openModal, setOpenModal] = useState(show);
    const [loading, withLoading] = useLoading();
    const api = useApi();

    const [selectedScale, setSelectedScale] = useState<number | undefined>(undefined);

    const dismissNPSModal = async () => {
        await api(dismissNps());
        setOpenModal(false);
    };

    return (
        <Modal size="large" fullscreenOnMobile open={openModal}>
            <ModalHeader title={c('Title').t`We'd love to hear from you!`} hasClose={false} />
            <ModalContent className="pt-4">
                <p className="m-0 mt-6 mb-3 text-semibold">{c('new_plans: label')
                    .t`We're always striving to make ${config.appName} better. How satisfied are you with your experience?`}</p>
                <ScaleLadder
                    from={0}
                    to={10}
                    value={selectedScale}
                    fromLabel={c('Label').t`Very Dissatisfied`}
                    toLabel={c('Label').t`Extremely Satisfied`}
                    onChange={setSelectedScale}
                    className="mb-8"
                />

                <InputFieldTwo
                    as={TextAreaTwo}
                    id="feedback-input"
                    label={c('Label').t`Tell us more about your experience`}
                    placeholder={c('Placeholder').t`Optional feedback`}
                />
            </ModalContent>
            <ModalFooter>
                <Button loading={loading} size="small" shape="ghost" onClick={() => withLoading(dismissNPSModal)}>{c(
                    'Action'
                ).t`Not now`}</Button>
                <Button color="norm">{c('Action').t`Send Feedback`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default NetPromoterScoreModal;
