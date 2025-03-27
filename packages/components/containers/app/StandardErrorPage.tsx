import { type ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import metrics from '@proton/metrics';

import GenericError from '../error/GenericError';

interface Props {
    children?: ReactNode;
    big?: boolean;
}

const StandardErrorPage = ({ children, big }: Props) => {
    useDocumentTitle(c('Error message').t`Oops, something went wrong`);

    useEffect(() => {
        metrics.core_ui_blocking_error_page_total.increment({});
    }, []);

    return (
        <div className="h-full flex items-center pb-14 overflow-auto">
            <GenericError big={big}>{children}</GenericError>
        </div>
    );
};

export default StandardErrorPage;
