import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { dismissNps, submitNps } from '@proton/shared/lib/api/netPromoterScore';
import { getOs } from '@proton/shared/lib/helpers/browser';

import ScaleLadder from '../../components/input/ScaleLadder';
import Modal from '../../components/modalTwo/Modal';
import ModalContent from '../../components/modalTwo/ModalContent';
import ModalFooter from '../../components/modalTwo/ModalFooter';
import ModalHeader from '../../components/modalTwo/ModalHeader';
import InputFieldTwo from '../../components/v2/field/InputField';
import TextAreaTwo from '../../components/v2/input/TextArea';
import useApi from '../../hooks/useApi';
import useErrorHandler from '../../hooks/useErrorHandler';
import type { NetPromoterScoreModalProps } from './interface';

const NetPromoterScoreModal = ({ open, onClose, config, updateFeatureValue }: NetPromoterScoreModalProps) => {
    const [loadingByKey, withLoadingByKey] = useLoadingByKey();
    const [optionalComment, setOptionalComment] = useState('');
    const errorHandler = useErrorHandler();
    const api = useApi();
    const { name = 'other' } = getOs();

    const [selectedScale, setSelectedScale] = useState<number | undefined>(undefined);

    const dismissNPSModal = async () => {
        try {
            await api(dismissNps({ OS: name }));
        } catch (error) {
            errorHandler(error);
        }
        void updateFeatureValue(false);
        onClose();
    };

    const submitNPSScore = async () => {
        if (selectedScale === undefined) {
            return;
        }

        try {
            await api(submitNps({ Score: selectedScale, Comment: optionalComment, OS: name }));
            void updateFeatureValue(false);
            onClose();
        } catch (error) {
            errorHandler(error);
        }
    };

    return (
        <Modal size="large" fullscreenOnMobile open={open}>
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
                    onValue={(value: string) => {
                        setOptionalComment(value);
                    }}
                />
            </ModalContent>
            <ModalFooter>
                <Button
                    loading={loadingByKey.dismiss}
                    size="small"
                    shape="ghost"
                    onClick={() => withLoadingByKey('dismiss', dismissNPSModal)}
                >
                    {c('Action').t`Not now`}
                </Button>

                <Button
                    color="norm"
                    disabled={selectedScale === undefined}
                    loading={loadingByKey.submit}
                    onClick={() => withLoadingByKey('submit', submitNPSScore)}
                >
                    {c('Action').t`Send Feedback`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default NetPromoterScoreModal;
