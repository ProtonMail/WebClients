import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import physicalKey from '@proton/styles/assets/img/illustrations/physical-key.svg';

import Banner, { BannerBackgroundColor } from '../../../components/banner/Banner';

interface Props {
    loading?: boolean;
    error?: boolean;
}

const RegisterSecurityKeyContent = ({ loading, error }: Props) => {
    return (
        <>
            <div className="flex flex-justify-center mt-4 mb-6 relative">
                {loading && (
                    <div className="text-center absolute absolute-center">
                        <CircleLoader className="color-primary" />
                    </div>
                )}
                <img
                    className={loading ? 'visibility-hidden' : undefined}
                    src={physicalKey}
                    alt={c('fido2: Info').t`Security key`}
                />
            </div>
            <div>{c('fido2: Info').t`Insert your security key into your device's USB port.`}</div>
            {error && (
                <div className="mt-4">
                    <Banner icon="exclamation-circle" backgroundColor={BannerBackgroundColor.WEAK}>
                        {c('fido2: Error').t`Something went wrong registering your security key. Please try again.`}
                    </Banner>
                </div>
            )}
        </>
    );
};

export default RegisterSecurityKeyContent;
