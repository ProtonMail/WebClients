import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import Href from './Href';

const LearnMore = ({ url }) => {
    return <Href url={url}>{t`Learn more`}</Href>;
};

LearnMore.propTypes = {
    url: PropTypes.string.isRequired
};

export default LearnMore;