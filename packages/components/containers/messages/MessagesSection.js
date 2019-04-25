import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { SubTitle, Row, Field, Label, Info, useMailSettings } from 'react-components';

import RemoteToggle from './RemoteToggle';
import EmbeddedToggle from './EmbeddedToggle';

const MessagesSection = () => {
    const [mailSettings] = useMailSettings();
    const [showImages, setShowImages] = useState(mailSettings.ShowImages);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setShowImages(mailSettings.ShowImages);
    }, [mailSettings.ShowImages]);

    const handleChange = (newValue) => setShowImages(newValue);

    return (
        <>
            <SubTitle>{c('Title').t`Messages`}</SubTitle>
            <Row>
                <Label htmlFor="remoteToggle">
                    <span className="mr1">{c('Label').t`Auto-load remote content`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/images-by-default/" />
                </Label>
                <Field>
                    <RemoteToggle id="remoteToggle" showImages={showImages} onChange={handleChange} />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="embeddedToggle">
                    <span className="mr1">{c('Label').t`Auto-load embedded images`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/images-by-default/" />
                </Label>
                <Field>
                    <EmbeddedToggle id="embeddedToggle" showImages={showImages} onChange={handleChange} />
                </Field>
            </Row>
        </>
    );
};

export default MessagesSection;
