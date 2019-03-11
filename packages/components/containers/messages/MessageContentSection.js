import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { c } from 'ttag';
import { SubTitle, Row, Label, Info } from 'react-components';

import RemoteToggle from './RemoteToggle';
import EmbeddedToggle from './EmbeddedToggle';

const MessageContentSection = ({ mailSettings }) => {
    const [showImages, setShowImages] = useState(mailSettings.ShowImages);
    const handleChange = (newValue) => setShowImages(newValue);
    return (
        <>
            <SubTitle>{c('Title').t`Address verification`}</SubTitle>
            <Row>
                <Label htmlFor="remoteToggle">
                    <span className="mr1">{c('Label').t`Auto-load remote content`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/images-by-default/" />
                </Label>
                <RemoteToggle id="remoteToggle" showImages={showImages} onChange={handleChange} />
            </Row>
            <Row>
                <Label htmlFor="embeddedToggle">
                    <span className="mr1">{c('Label').t`Auto-load embedded images`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/images-by-default/" />
                </Label>
                <EmbeddedToggle id="embeddedToggle" showImages={showImages} onChange={handleChange} />
            </Row>
        </>
    );
};

MessageContentSection.propTypes = {
    mailSettings: PropTypes.object.isRequired
};

const mapStateToProps = ({ mailSettings: { data } }) => ({ mailSettings: data });

export default connect(mapStateToProps)(MessageContentSection);
