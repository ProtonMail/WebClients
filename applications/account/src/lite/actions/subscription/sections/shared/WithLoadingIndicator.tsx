import type { PropsWithChildren } from 'react';

import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';

interface Props {
    loading: boolean;
    className?: string;
}
const WithLoadingIndicator = ({ loading, children, className }: PropsWithChildren<Props>) => {
    if (loading) {
        return <EllipsisLoader className={className} />;
    }
    return children;
};

export default WithLoadingIndicator;
