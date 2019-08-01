import React from 'react';
import { c } from 'ttag';
import { PropTypes, IllustrationPlaceholder } from 'prop-types';

import errorImg from 'design-system/assets/img/shared/generic-error.svg';

const GenericError = ({ className }) => {
    return (
        <IllustrationPlaceholder
            className={className}
            title={c('Error message').t`Aaah! Something went wrong`}
            text={
                <>
                    <span>{c('Error message').t`Brace yourself till we get the error fixed.`}</span>
                    <span>{c('Error message').t`You may also refresh the page or try again later.`}</span>
                </>
            }
            url={errorImg}
        />
    );
};

GenericError.propTypes = {
    className: PropTypes.string
};

export default GenericError;
