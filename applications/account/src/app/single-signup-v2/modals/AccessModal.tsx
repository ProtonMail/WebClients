import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    WALLET_APP_NAME,
    WALLET_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { type User } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

import driveAccess from '../drive/access.svg';
import mailAccess from '../mail/access.svg';
import passAccess from '../pass/access.svg';
import walletAccess from '../wallet/access.svg';

interface Props extends ModalProps {
    onContinue: () => void;
    onSignOut: () => Promise<void>;
    app: APP_NAMES;
    user?: User;
}

const AccessModal = ({ app, onClose, onContinue, onSignOut, user, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { svg, appName, shortName } = (() => {
        if (app === APPS.PROTONPASS) {
            return { svg: passAccess, appName: PASS_APP_NAME, shortName: PASS_SHORT_APP_NAME };
        }
        if (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR) {
            return { svg: mailAccess, appName: MAIL_APP_NAME, shortName: MAIL_SHORT_APP_NAME };
        }
        if (app === APPS.PROTONDRIVE) {
            return { svg: driveAccess, appName: DRIVE_APP_NAME, shortName: DRIVE_SHORT_APP_NAME };
        }
        if (app === APPS.PROTONWALLET) {
            return { svg: walletAccess, appName: WALLET_APP_NAME, shortName: WALLET_SHORT_APP_NAME };
        }
        throw new Error('unknown app');
    })();

    const isPassLifetime = user && hasPassLifetime(user);

    const getWelcomeText = (plan: string) => {
        return c('pass_signup_2023: Info').t`Welcome to ${plan}`;
    };

    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoContent>
                <div className="text-center">
                    {svg && <img src={svg} alt="" className="mb-4 mt-4" />}
                    <div className="mb-4 text-bold h3">
                        {isPassLifetime ? getWelcomeText(PLAN_NAMES[PLANS.PASS_LIFETIME]) : getWelcomeText(shortName)}
                    </div>
                    <div className="mb-6 color-weak">
                        {c('pass_signup_2023: Info')
                            .t`You already have access to premium ${appName} features — no need to purchase again.`}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    shape="ghost"
                    color="norm"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(onSignOut().then(() => onClose?.()));
                    }}
                    fullWidth
                >
                    {c('pass_signup_2023: Action').t`Create another account instead`}
                </Button>
                <Button
                    color="norm"
                    onClick={() => {
                        onContinue();
                        onClose?.();
                    }}
                    fullWidth
                >
                    {c('pass_signup_2023: Action').t`Start using ${appName}`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AccessModal;
