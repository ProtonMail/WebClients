import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
import { getCountryOptions, getLocalizedCountryByAbbr } from '@proton/payments/core/countries';
import { getApplicationNameWithPlatform } from '@proton/shared/lib/apps/getApplicationNameWithPlatform';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { ForkCodeLocation } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

interface Props {
    app: APP_NAMES;
    childClientId: string;
    location?: ForkCodeLocation;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

/** Where the device that asks to sign in is: its country, with its IP address below */
const LocationCard = ({ IP, CountryCode }: ForkCodeLocation) => {
    const country = CountryCode ? getLocalizedCountryByAbbr(CountryCode, getCountryOptions()) || CountryCode : '';
    const ipAddress = IP ? c('Info').t`IP address: ${IP}` : '';
    const [title, subtitle] = country ? [country, ipAddress] : [ipAddress, ''];
    return (
        <div
            className="flex flex-nowrap items-start gap-3 border border-weak rounded-lg p-3 mb-6 color-weak"
            data-testid="desktop-fork-location"
        >
            <span
                className="flex items-center justify-center shrink-0 rounded-full bg-weak w-custom ratio-square"
                style={{ '--w-custom': '2rem' }}
            >
                <IcMapPin className="color-primary" />
            </span>
            <div className="min-w-0">
                <strong className="block text-break">{title}</strong>
                {subtitle && <div className="text-sm text-break">{subtitle}</div>}
            </div>
        </div>
    );
};

const ConfirmDesktopForkContainer = ({ app, childClientId, location, onConfirm, onCancel }: Props) => {
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const applicationName = getApplicationNameWithPlatform(getAppName(app), childClientId);
    const hasLocation = Boolean(location?.IP || location?.CountryCode);

    return (
        <Layout hasDecoration={false} toApp={app}>
            <Main>
                <Header title={c('Title').t`Confirm sign in`} />
                <Content>
                    {location && hasLocation ? (
                        <>
                            <Text margin="small">
                                {getBoldFormattedText(c('Info').t`**${applicationName}** requested to sign in from:`)}
                            </Text>
                            <LocationCard {...location} />
                        </>
                    ) : (
                        <Text>{getBoldFormattedText(c('Info').t`**${applicationName}** requested to sign in.`)}</Text>
                    )}
                    <Text>
                        {getBoldFormattedText(
                            c('Info')
                                .t`If you didn't just try to sign in to **${applicationName}** on a device you own, click **Cancel**.`
                        )}
                    </Text>
                    <Button
                        className="mb-2"
                        color="norm"
                        fullWidth
                        size="large"
                        onClick={() => withLoading(onConfirm().catch(handleError))}
                        loading={loading}
                    >
                        {c('Action').t`Confirm`}
                    </Button>
                    <Button shape="ghost" color="norm" fullWidth size="large" onClick={onCancel} disabled={loading}>
                        {c('Action').t`Cancel`}
                    </Button>
                </Content>
            </Main>
        </Layout>
    );
};

export default ConfirmDesktopForkContainer;
