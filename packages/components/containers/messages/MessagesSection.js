import React, { useState } from 'react';
import { c } from 'ttag';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { Row, Field, Label, Info, AppLink } from '../../components';
import { useMailSettings, useUser } from '../../hooks';

import RemoteToggle from './RemoteToggle';
import EmbeddedToggle from './EmbeddedToggle';
import ShowMovedToggle from './ShowMovedToggle';
import RequestLinkConfirmationToggle from './RequestLinkConfirmationToggle';
import DelaySendSecondsSelect from './DelaySendSecondsSelect';

const MessagesSection = () => {
    const [user] = useUser();
    const [{ ShowImages, ConfirmLink, DelaySendSeconds } = {}] = useMailSettings();
    const [showImages, setShowImages] = useState(ShowImages);
    const handleChange = (newValue) => setShowImages(newValue);

    return (
        <>
            <Row>
                <Label htmlFor="remoteToggle">
                    <span className="mr0-5">{c('Label').t`Auto-load remote content`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/images-by-default/" />
                </Label>
                <Field>
                    <RemoteToggle id="remoteToggle" showImages={showImages} onChange={handleChange} />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="embeddedToggle">
                    <span className="mr0-5">{c('Label').t`Auto-load embedded images`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/images-by-default/" />
                </Label>
                <Field>
                    <EmbeddedToggle id="embeddedToggle" showImages={showImages} onChange={handleChange} />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="showMovedToggle">
                    <span className="mr0-5">{c('Label').t`Sent/Drafts`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Setting to 'Include moved' means that sent / draft messages that have been moved to other folders will continue to appear in the Sent/Drafts folder.`}
                    />
                </Label>
                <Field>
                    <ShowMovedToggle id="showMovedToggle" />
                    <Label htmlFor="showMovedToggle" className="ml1">{c('Label').t`Include moved`}</Label>
                </Field>
            </Row>
            <Row>
                <Label htmlFor="requestLinkConfirmationToggle">{c('Label').t`Request link confirmation`}</Label>
                <Field>
                    <RequestLinkConfirmationToggle confirmLink={ConfirmLink} id="requestLinkConfirmationToggle" />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="delaySendSecondsSelect">
                    <span className="mr0-5">{c('Label').t`Delay message sending`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`You can delay your message sending by 5, 10 or 20 seconds, which gives you the possibility to cancel and go back to editing your draft.`}
                    />
                </Label>
                <Field>
                    {user.isPaid ? (
                        <DelaySendSecondsSelect id="delaySendSecondsSelect" delaySendSeconds={DelaySendSeconds} />
                    ) : (
                        <div className="pt0-5">
                            <AppLink to="/subscription" toApp={getAccountSettingsApp()}>{c('Action')
                                .t`Upgrade`}</AppLink>
                        </div>
                    )}
                </Field>
            </Row>
        </>
    );
};

export default MessagesSection;
