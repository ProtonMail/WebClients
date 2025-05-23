import type { ComponentType } from 'react';
import { type ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import metrics from '@proton/metrics';
import clsx from '@proton/utils/clsx';

import GenericError, { type GenericErrorProps } from '../error/GenericError';

interface Props {
    big?: boolean;
    children?: ReactNode;
    className?: string;
    /** Optional override of the `GenericError` component. */
    errorComponent?: ComponentType<GenericErrorProps>;
}

export const StandardErrorPageDisplay = ({
    big,
    className,
    children,
    errorComponent: ErrorComponent = GenericError,
}: Props) => {
    useDocumentTitle(c('Error message').t`Oops, something went wrong`);

    return (
        <div className={clsx('h-full flex items-center pb-14 overflow-auto', className)}>
            <ErrorComponent big={big}>{children}</ErrorComponent>
        </div>
    );
};

const StandardErrorPage = (props: Props) => {
    useEffect(() => metrics.core_ui_blocking_error_page_total.increment({}), []);
    return <StandardErrorPageDisplay {...props} />;
};

export default StandardErrorPage;
