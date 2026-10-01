import { c } from 'ttag';

import { Card, type CardProps } from '@proton/atoms/Card/Card';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { useSignInProps } from '../../wizard/SignInProvider';
import testflight from './testflight.png';

/** The VPN iOS Beta's sign-in (vpn-settings, `?redirect=ios-beta`), which leads to Apple Testflight after it. */
const useIsTestflight = () => useSignInProps().testflight === 'vpn';

interface Props extends Omit<CardProps<'div'>, 'rounded' | 'bordered' | 'background'> {}

const TestflightCard = (props: Props) => {
    const destination = 'Apple Testflight';
    return (
        <Card rounded {...props}>
            <div className="flex flex-nowrap gap-3">
                <img src={testflight} height={40} width={40} alt="" className="shrink-0 rounded" />
                <span>
                    {
                        // translator: Full sentence: You will be redirected to Apple Testflight after signing in.
                        c('Info').t`You will be redirected to ${destination} after signing in.`
                    }
                </span>
            </div>
        </Card>
    );
};

/** Where the testflight variant's sign-in leads, above the credentials screens. */
export const TestflightBanner = () =>
    useIsTestflight() ? (
        <>
            <TestflightCard className="mb-8" />
            <div className="mb-1" />
        </>
    ) : null;

/** The testflight variant's title, which a credentials screen shows instead of its own: the page is about the Beta. */
export const useTestflightTitle = () =>
    useIsTestflight() ? c('Title').t`Sign in to join the Beta program` : undefined;

/** The testflight variant's subtitle, which a credentials screen shows instead of its own. */
export const useTestflightSubTitle = () => {
    const app = `${VPN_APP_NAME} iOS`;
    return useIsTestflight()
        ? // translator: full sentence is: "Enter your Proton Account details to join the Proton VPN iOS Beta program"
          c('Title').t`Enter your ${BRAND_NAME} Account details to join the ${app} Beta program`
        : undefined;
};
