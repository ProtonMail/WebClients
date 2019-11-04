import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Field, Toggle, RichTextEditor, Row } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function AutoReplyAction({ defaultValue = null, onChange = noop }) {
    const [activated, setActivated] = useState(!!defaultValue);
    const [content, setContent] = useState(defaultValue);

    useEffect(() => {
        onChange(activated ? content : null);
    }, [activated, content]);

    return (
        <>
            <Row>
                <Label>{/* Dummy label to hold space */ ' '}</Label>
                <Field>
                    <Toggle
                        className="mr1"
                        checked={activated}
                        id="sendAutoReplyToggle"
                        onChange={() => setActivated(!activated)}
                    />
                    <Label htmlFor="sendAutoReplyToggle">
                        <span className="mr0-5">{c('Label').t`Send auto reply`}</span>
                    </Label>
                </Field>
            </Row>
            {activated && (
                <Row className="pb3">
                    <RichTextEditor
                        className="w100"
                        placeholder={c('Placeholder').t`Auto reply content`}
                        value={content}
                        onChange={(content) => setContent(content)}
                    />
                </Row>
            )}
        </>
    );
}

AutoReplyAction.propTypes = {
    defaultValue: PropTypes.string,
    onChange: PropTypes.func
};

export default AutoReplyAction;
