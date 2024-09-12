import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

import driveAccess from '../drive/access.svg';
import mailAccess from '../mail/access.svg';
import passAccess from '../pass/access.svg';

interface Props extends ModalProps {
    onContinue: () => void;
    onSignOut: () => Promise<void>;
    app: APP_NAMES;
}

const AccessModal = ({ app, onClose, onContinue, onSignOut, ...rest }: Props) => {
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
        throw new Error('unknown app');
    })();
    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoContent>
                <div className="text-center">
                    <img src={svg} alt="" className="mb-4 mt-4" />
                    <div className="mb-4 text-bold h3">{c('pass_signup_2023: Info')
                        .t`Welcome to ${shortName} Plus`}</div>
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
