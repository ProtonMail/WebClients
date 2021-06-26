import React, { ReactNode } from 'react';
import { c } from 'ttag';

import errorImg from '@proton/styles/assets/img/errors/generic-error.svg';

import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';
import InlineLinkButton from '../../components/button/InlineLinkButton';

interface Props {
    className?: string;
    children?: ReactNode;
}

const GenericError = ({ className, children }: Props) => {
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
