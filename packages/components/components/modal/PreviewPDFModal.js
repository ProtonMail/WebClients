import PropTypes from 'prop-types';
import { c } from 'ttag';

import FormModal from './FormModal';

/**
 * @deprecated Please use ModalTwo instead
 */
const PreviewPDFModal = ({ url, title = c('Title').t`Preview`, filename, ...rest }) => {
    return (
        <FormModal title={title} close={c('Action').t`Close`} hasSubmit={false} {...rest}>
            <object data={url} className="w-full" type="application/pdf" height={500} title={filename}>
                <embed src={url} type="application/pdf" />
            </object>
        </FormModal>
    );
};

PreviewPDFModal.propTypes = {
    onClose: PropTypes.func,
    url: PropTypes.string,
    title: PropTypes.string,
    filename: PropTypes.string,
};

export default PreviewPDFModal;
