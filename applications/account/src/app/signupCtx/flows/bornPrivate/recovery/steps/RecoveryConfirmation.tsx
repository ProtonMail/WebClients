import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Icon } from '@proton/components';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateMain from '../../components/BornPrivateMain';

const RecoveryConfirmation = () => {
    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateMain>
                <div
                    className={
                        'rounded-xl sm:mt-6 md:p-11 pb-8 sm:pb-11 born-private-reservation-bg-gradient md:max-w-custom flex flex-column items-center text-center'
                    }
                    style={{ '--md-max-w-custom': '32rem' }}
                >
                    <Icon name="checkmark-circle" size={12} className="color-primary mb-4" />
                    <p className="m-0 text-lg" style={{ lineHeight: 1.4 }}>
                        {c('Info')
                            .t`If the email you entered was used to reserve a child's email address, we'll resend the activation voucher.`}
                    </p>
                    <ButtonLike
                        as={Link}
                        to={SSO_PATHS.BORN_PRIVATE_ACTIVATE}
                        color="weak"
                        shape="outline"
                        size="large"
                        fullWidth
                        className="mt-8"
                    >
                        {c('Action').t`Activate reserved address`}
                    </ButtonLike>
                </div>
            </BornPrivateMain>
        </BornPrivateLayout>
    );
};

export default RecoveryConfirmation;
