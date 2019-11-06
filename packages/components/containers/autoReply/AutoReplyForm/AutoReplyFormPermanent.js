import { c } from 'ttag';
import PropTypes from 'prop-types';
import React from 'react';

import Alert from '../../../components/alert/Alert';
import { modelShape } from './autoReplyShapes';

const AutoReplyFormPermanent = () => {
    return (
        <>
            <Alert>{c('Info').t`Auto-reply is active until you turn it off.`}</Alert>
        </>
    );
};

AutoReplyFormPermanent.propTypes = {
    model: modelShape,
    updateModel: PropTypes.func
};

export default AutoReplyFormPermanent;
