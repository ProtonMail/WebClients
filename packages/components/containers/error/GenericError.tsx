import React, { ReactNode } from 'react';
import { c } from 'ttag';

import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import errorImgLight from 'design-system/assets/img/shared/generic-error.svg';
import errorImgDark from 'design-system/assets/img/shared/generic-error-dark.svg';

import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

interface Props {
    className?: string;
    children?: ReactNode;
}

const GenericError = ({ className, children }: Props) => {
    const errorImg = getLightOrDark(errorImgLight, errorImgDark);
    return (
        <IllustrationPlaceholder
            className={className}
            title={c('Error message').t`Oops, something went wrong`}
            url={errorImg}
        >
            {children || (
                <>
                    <span>{c('Error message').t`Brace yourself till we get the error fixed.`}</span>
                    <span>{c('Error message').t`You may also refresh the page or try again later.`}</span>
                </>
            )}
        </IllustrationPlaceholder>
    );
};

export default GenericError;
