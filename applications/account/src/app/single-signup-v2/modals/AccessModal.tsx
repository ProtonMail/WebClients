import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components/components';

import access from '../pass/access.svg';

interface Props extends ModalProps {
    plan: string;
    appName: string;
}

const AccessModal = ({ plan, appName, ...rest }: Props) => {
    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoContent>
                <div className="text-center">
                    <img src={access} alt="" className="mb-4 mt-4" />
                    <div className="mb-4 text-bold h3">{c('pass_signup_2023: Info').t`Welcome to ${plan}`}</div>
                    <div className="mb-6 color-weak">
                        {c('pass_signup_2023: Info')
                            .t`You already have access to premium ${appName} features — no need to purchase again.`}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" onClick={rest.onClose} fullWidth>
                    {c('pass_signup_2023: Action').t`Start using ${appName}`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AccessModal;
