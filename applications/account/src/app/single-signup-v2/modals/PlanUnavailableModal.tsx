import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, DRIVE_APP_NAME, MAIL_APP_NAME, PASS_APP_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    onContinue: () => void;
    onSignOut: () => Promise<void>;
    app: APP_NAMES;
    user?: User;
}

const PlanUnavailableModal = ({ app, onClose, onContinue, onSignOut, user, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { appName } = (() => {
        if (app === APPS.PROTONPASS) {
            return { appName: PASS_APP_NAME };
        }
        if (app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR) {
            return { appName: MAIL_APP_NAME };
        }
        if (app === APPS.PROTONDRIVE) {
            return { appName: DRIVE_APP_NAME };
        }
        if (app === APPS.PROTONWALLET) {
            return { appName: WALLET_APP_NAME };
        }
        throw new Error('unknown app');
    })();

    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoContent>
                <div className="text-center">
                    <div className="my-4 text-bold h3">{c('Payments').t`Offer unavailable`}</div>
                    <div className="mb-6 color-weak">{c('Payments')
                        .t`Sorry, this offer is not available with your current plan.`}</div>
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
                    {c('pass_signup_2023: Action - open web app').t`Continue to ${appName}`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PlanUnavailableModal;
