import { ReactNode } from 'react';
import { c } from 'ttag';

import errorImg from '@proton/styles/assets/img/errors/generic-error.svg';

import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';
import InlineLinkButton from '../../components/button/InlineLinkButton';
import { classnames } from '../../helpers';

interface Props {
    className?: string;
    children?: ReactNode;
    small?: boolean;
}

const GenericError = ({ children, className, small = false }: Props) => {
    const refresh = (
        <InlineLinkButton key="1" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    const title = c('Error message').t`Oops, something went wrong`;
    const line1 = c('Error message').t`Brace yourself till we get the error fixed.`;
    const line2 = c('Error message').jt`You may also ${refresh} or try again later.`;

    return (
        <div className={classnames(['mauto', className])}>
            {small ? (
                <>
                    <h2 className="text-bold">{title}</h2>
                    <div className="text-center">{line1}</div>
                    <div className="text-center">{line2}</div>
                </>
            ) : (
                <IllustrationPlaceholder title={title} url={errorImg}>
                    {children || (
                        <>
                            <span>{line1}</span>
                            <span>{line2}</span>
                        </>
                    )}
                </IllustrationPlaceholder>
            )}
        </div>
    );
};

export default GenericError;
