import React from 'react';
import { c } from 'ttag';
import internalServerErrorSvg from 'design-system/assets/img/errors/error-500.svg';
import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

const InternalServerError = () => {
    return (
        <IllustrationPlaceholder title={c('Error message').t`Internal server error`} url={internalServerErrorSvg}>
            <>
                <span>{c('Error message').t`Brace yourself till we get the error fixed.`}</span>
                <span>{c('Error message').t`You may also refresh the page or try again later.`}</span>
            </>
        </IllustrationPlaceholder>
    );
};

export default InternalServerError;
