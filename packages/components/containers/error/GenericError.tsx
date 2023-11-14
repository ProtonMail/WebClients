import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import ElectronDraggeableHeader from '@proton/components/components/electron/ElectronDraggeableHeader';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import networkErrorImg from '@proton/styles/assets/img/errors/error-network.svg';
import clsx from '@proton/utils/clsx';

import Icon from '../../components/icon/Icon';
import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

interface Props {
    className?: string;
    children?: ReactNode;
    big?: boolean;
    isNetworkError?: boolean;
}

const GenericError = ({ children, className, big, isNetworkError }: Props) => {
    const title = c('Error message').t`Something went wrong`;
    const line1 = c('Error message').jt`Please refresh the page or try again later.`;

    const display: 'default' | 'with-refresh' | 'custom' = (() => {
        if (children) {
            return 'custom';
        }
        return big ? 'with-refresh' : 'default';
    })();

    return (
        <div className={clsx('m-auto', big ? 'p-1' : 'p-2', className)}>
            {big && <ElectronDraggeableHeader />}
            <IllustrationPlaceholder
                title={title}
                titleSize={big ? 'big' : 'regular'}
                url={isNetworkError ? networkErrorImg : errorImg}
            >
                {display === 'default' && <div className="text-weak text-sm">{line1}</div>}
                {display === 'with-refresh' && (
                    <>
                        <div className="text-weak text-rg">{line1}</div>
                        <div className="mt-8">
                            <Button onClick={() => window.location.reload()}>
                                <Icon name="arrow-rotate-right" />
                                <span className="ml-4">{c('Action').t`Refresh the page`}</span>
                            </Button>
                        </div>
                    </>
                )}
                {display === 'custom' && children}
            </IllustrationPlaceholder>
        </div>
    );
};

export default GenericError;
