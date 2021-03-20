import React, { ReactNode } from 'react';
import { c } from 'ttag';

import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import errorImgLight from 'design-system/assets/img/shared/generic-error.svg';
import errorImgDark from 'design-system/assets/img/shared/generic-error-dark.svg';

import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';
import InlineLinkButton from '../../components/button/InlineLinkButton';

interface Props {
    className?: string;
    children?: ReactNode;
}

const GenericError = ({ className, children }: Props) => {
    const errorImg = getLightOrDark(errorImgLight, errorImgDark);

    const refresh = (
        <InlineLinkButton key="1" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    return (
        <IllustrationPlaceholder
            className={className}
            title={c('Error message').t`Oops, something went wrong`}
            url={errorImg}
        >
            {children || (
                <>
                    <span>{c('Error message').t`Brace yourself till we get the error fixed.`}</span>
                    <span>{c('Error message').jt`You may also ${refresh} or try again later.`}</span>
                </>
            )}
        </IllustrationPlaceholder>
    );
};

export default GenericError;
