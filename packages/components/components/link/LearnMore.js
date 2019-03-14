import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import Href from './Href';

const LearnMore = ({ url }) => {
    return <Href url={url}>{c('Link').t`Learn more`}</Href>;
};

LearnMore.propTypes = {
    url: PropTypes.string.isRequired
};

export default LearnMore;
