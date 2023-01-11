import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { TextLoader } from '@proton/components/index';

interface Props {
    isConnectingToProvider: boolean;
    children: React.ReactNode | React.ReactNode[];
}

const ProviderWrapper = ({ children, isConnectingToProvider }: Props) => {
    if (isConnectingToProvider) {
        return (
            <div className="p1 text-center w100">
                <CircleLoader size="large" />
                <TextLoader>{c('Loading info').t`Connecting to your email provider`}</TextLoader>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProviderWrapper;
