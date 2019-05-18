import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { FormModal } from 'react-components';

const PreviewPDFModal = ({ url, title, filename, ...rest }) => {
    return (
        <FormModal title={title} close={c('Action').t`Close`} {...rest}>
            <object data={url} className="w100" type="application/pdf" height={500} title={filename}>
                <embed src={url} type="application/pdf" />
            </object>
        </FormModal>
    );
};

PreviewPDFModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    url: PropTypes.string,
    title: PropTypes.string,
    filename: PropTypes.string
};

PreviewPDFModal.defaultProps = {
    title: c('Title').t`Preview`
};

export default PreviewPDFModal;
