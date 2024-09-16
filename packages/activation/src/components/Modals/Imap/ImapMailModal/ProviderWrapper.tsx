import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { TextLoader } from '@proton/components';

interface Props {
    isConnectingToProvider: boolean;
    children: React.ReactNode | React.ReactNode[];
}

const ProviderWrapper = ({ children, isConnectingToProvider }: Props) => {
    if (isConnectingToProvider) {
        return (
            <div className="p-4 text-center w-full">
                <CircleLoader size="large" />
                <TextLoader>{c('Loading info').t`Connecting to your email provider`}</TextLoader>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProviderWrapper;
