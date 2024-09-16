import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';

import { SettingsLink } from '../../components';
import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';

const RecoverDataConfirmModal = (props: Omit<PromptProps, 'open' | 'title' | 'buttons' | 'children'>) => {
    const [dismissing, setDismissing] = useState(false);
    const { update: setDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);

    const boldDataLocked = (
        <b key="data-locked-bold-text">{
            // translator: Full sentence is 'The Data locked message will no longer be shown, but you can still unlock your data under Encryption and keys.'
            c('Info').t`Data locked`
        }</b>
    );

    const encryptionAndKeysLink = (
        <SettingsLink path="/encryption-keys" key="link">{
            // translator: Full sentence is 'The Data locked message will no longer be shown, but you can still unlock your data under Encryption and keys.'
            c('Link').t`Encryption and keys`
        }</SettingsLink>
    );

    return (
        <Prompt
            {...props}
            title={c('Title').t`Don't show again?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={async () => {
                        setDismissing(true);
                        await setDismissedRecoverDataCard(true);
                        setDismissing(false);
                        props.onClose?.();
                    }}
                    loading={dismissing}
                >
                    {c('Action').t`Don't show again`}
                </Button>,
                <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>
                {
                    // translator: Full sentence is 'The Data locked message will no longer be shown, but you can still unlock your data under Encryption and keys.'
                    c('Info')
                        .jt`The ${boldDataLocked} message will no longer be shown, but you can still unlock your data under ${encryptionAndKeysLink}.`
                }
            </p>
        </Prompt>
    );
};

export default RecoverDataConfirmModal;
