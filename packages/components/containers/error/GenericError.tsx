import { ReactNode } from 'react';

import { c } from 'ttag';

import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import clsx from '@proton/utils/clsx';

import InlineLinkButton from '../../components/button/InlineLinkButton';
import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

interface Props {
    className?: string;
    children?: ReactNode;
    small?: boolean;
}

const GenericError = ({ children, className, small = false }: Props) => {
    // translator: The full sentence is "Please refresh the page or try again later", "refresh the page" is a button
    const refresh = (
        <InlineLinkButton key="1" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    const title = c('Error message').t`Something went wrong`;
    // translator: The full sentence is "Please refresh the page or try again later", "refresh the page" is a button
    const line1 = c('Error message').jt`Please ${refresh} or try again later.`;

    return (
        <div className={clsx('mauto', className)}>
            {small ? (
                <>
                    <h1 className="text-bold h2 mb-1">{title}</h1>
                    <div className="text-center">{line1}</div>
                </>
            ) : (
                <IllustrationPlaceholder title={title} url={errorImg}>
                    {children || (
                        <>
                            <span>{line1}</span>
                        </>
                    )}
                </IllustrationPlaceholder>
            )}
        </div>
    );
};

export default GenericError;
