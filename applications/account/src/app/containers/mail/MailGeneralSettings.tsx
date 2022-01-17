import { c } from 'ttag';

import { MessagesSection, PmMeSection, SettingsPropsShared, useAddresses } from '@proton/components';

import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { UserModel, UserType } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';
import PrivateMainAreaLoading from '../../components/PrivateMainAreaLoading';

export const getGeneralPage = (user: UserModel, showPmMeSection: boolean) => {
    return {
        text: c('Title').t`General`,
        to: '/mail/general',
        icon: 'sliders',
        subsections: [
            showPmMeSection && {
                text: c('Title').t`Short domain (@pm.me)`,
                id: 'pmme',
            },
            {
                text: c('Title').t`Messages`,
                id: 'messages',
            },
            {
                text: c('Title').t`Spy Tracker Protection`,
                id: 'spy-tracker',
            },
        ].filter(isTruthy),
    };
};

interface Props extends SettingsPropsShared {
    user: UserModel;
}

const MailGeneralSettings = ({ location, user }: Props) => {
    const [addresses, loading] = useAddresses();

    if (loading && !Array.isArray(addresses)) {
        return <PrivateMainAreaLoading />;
    }

    const { hasPaidMail, canPay, Type } = user;
    const isExternalUser = Type === UserType.EXTERNAL;
    const isPMAddressActive = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
    const hasNoOriginalAddresses = !addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_ORIGINAL);
    const showPmMeSection = !isExternalUser && canPay && !hasNoOriginalAddresses && !(isPMAddressActive && hasPaidMail);

    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getGeneralPage(user, showPmMeSection)}>
            {showPmMeSection && <PmMeSection isPMAddressActive={isPMAddressActive} />}
            <MessagesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailGeneralSettings;
