import type { ReactNode } from 'react';
import { useContext, useEffect } from 'react';

import { differenceInMilliseconds } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { HOUR } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import networkErrorImg from '@proton/styles/assets/img/errors/error-network.svg';
import { FlagContext, useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

interface Props {
    className?: string;
    children?: ReactNode;
    big?: boolean;
    isNetworkError?: boolean;
    /** Custom image to display, should be local import in SVG format */
    customImage?: string;
    title?: string;
}

export const GenericErrorDisplay = ({ children, className, big, isNetworkError, title, customImage }: Props) => {
    const display: 'default' | 'with-refresh' | 'custom' = (() => {
        if (children) {
            return 'custom';
        }
        return big ? 'with-refresh' : 'default';
    })();

    const line1 = c('Error message').jt`Please refresh the page or try again later.`;

    const url = customImage || (isNetworkError ? networkErrorImg : errorImg);

    return (
        <div className={clsx('generic-error', 'm-auto', big ? 'p-1' : 'p-2', className)}>
            <IllustrationPlaceholder
                title={title ?? c('Error message').t`Something went wrong`}
                titleSize={big ? 'big' : 'regular'}
                url={url}
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

const GenericErrorWithReload = ({ children, className, big, isNetworkError }: Props) => {
    const autoReloadEnabled = useFlag('AutoReloadPage');

    const reloadPageOnError = () => {
        const now = new Date();
        const saveAndReloadPage = () => {
            setItem('alreadyRefreshedOnError', now.getTime().toString());
            window.location.reload();
        };

        let localStorageData = undefined;
        try {
            localStorageData = getItem('alreadyRefreshedOnError');
        } catch (e) {
            // localStorage is not available, so we return early to avoid a refresh loop
            return;
        }

        if (localStorageData) {
            const lastRefreshMinutesDiff = differenceInMilliseconds(now, +localStorageData);

            // We refresh the page if the last reload happened more than 60 minutes ago
            if (lastRefreshMinutesDiff > HOUR) {
                saveAndReloadPage();
            }
        } else {
            saveAndReloadPage();
        }
    };

    useEffect(() => {
        if (autoReloadEnabled && big) {
            reloadPageOnError();
        }
    }, []);

    return (
        <GenericErrorDisplay className={className} big={big} isNetworkError={isNetworkError}>
            {children}
        </GenericErrorDisplay>
    );
};

const GenericError = ({ children, className, big, isNetworkError }: Props) => {
    const isFlagAvailable = useContext(FlagContext);

    // Display the generic error if Unleash is not initalized yet
    if (!isFlagAvailable) {
        return (
            <GenericErrorDisplay className={className} big={big} isNetworkError={isNetworkError}>
                {children}
            </GenericErrorDisplay>
        );
    }

    return (
        <GenericErrorWithReload className={className} big={big} isNetworkError={isNetworkError}>
            {children}
        </GenericErrorWithReload>
    );
};

export default GenericError;
