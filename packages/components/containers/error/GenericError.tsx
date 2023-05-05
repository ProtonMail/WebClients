import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import networkErrorImg from '@proton/styles/assets/img/errors/error-network.svg';
import clsx from '@proton/utils/clsx';

import { Icon } from '../..';
import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

interface Props {
    className?: string;
    children?: ReactNode;
    big?: boolean;
    isNetworkError?: boolean;
}

const GenericError = ({ children, className, big, isNetworkError }: Props) => {
    const handleRefresh = () => window.location.reload();

    const title = c('Error message').t`Something went wrong`;
    const line1 = c('Error message').jt`Please refresh the page or try again later.`;

    const status: 'child' | 'big' | 'small' = (() => {
        if (!children && big) {
            return 'big';
        }
        if (!children && !big) {
            return 'small';
        }
        return 'child';
    })();

    return (
        <div className={clsx('m-auto', status === 'big' ? 'p-1' : 'p-2', className)}>
            <IllustrationPlaceholder
                title={title}
                titleSize={big ? 'big' : 'regular'}
                url={isNetworkError ? networkErrorImg : errorImg}
            >
                {status === 'child' && children}
                {status === 'big' && (
                    <>
                        <div className="text-weak text-rg">{line1}</div>
                        <div className="mt-8">
                            <Button onClick={handleRefresh}>
                                <Icon name="arrow-rotate-right" />
                                <span className="ml-4">{c('Action').t`Refresh the page`}</span>
                            </Button>
                        </div>
                    </>
                )}
                {status === 'small' && <div className="text-weak text-sm">{line1}</div>}
            </IllustrationPlaceholder>
        </div>
    );
};

export default GenericError;
