import { useState } from 'react';
import { c } from 'ttag';
import { AlertModal, Button, SettingsLink } from '../../components';
import { useFeature } from '../../hooks';
import { FeatureCode } from '../features/FeaturesContext';

interface Props {
    open: boolean;
    onClose: () => void;
}

const RecoverDataConfirmModal = ({ open, onClose }: Props) => {
    const [dismissing, setDismissing] = useState(false);
    const { update: setDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);

    const boldDataLocked = (
        <b key="data-locked-bold-text">{
            // translator: Full sentence is 'The Data locked message will no longer be shown, but you can still unlock your data under Encryption and keys.'
            c('Info').t`Data locked`
        }</b>
    );

    const encryptionAndKeysLink = (
        <SettingsLink path="/encryption-keys">{
            // translator: Full sentence is 'The Data locked message will no longer be shown, but you can still unlock your data under Encryption and keys.'
            c('Link').t`Encryption and keys`
        }</SettingsLink>
    );

    return (
        <AlertModal
            open={open}
            title={c('Title').t`Don't show again?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={async () => {
                        setDismissing(true);
                        await setDismissedRecoverDataCard(true);
                        setDismissing(false);
                        onClose();
                    }}
                    loading={dismissing}
                >
                    {c('Action').t`Don't show again`}
                </Button>,
                <Button onClick={() => onClose()}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>
                {
                    // translator: Full sentence is 'The Data locked message will no longer be shown, but you can still unlock your data under Encryption and keys.'
                    c('Info')
                        .jt`The ${boldDataLocked} message will no longer be shown, but you can still unlock your data under ${encryptionAndKeysLink}.`
                }
            </p>
        </AlertModal>
    );
};

export default RecoverDataConfirmModal;
