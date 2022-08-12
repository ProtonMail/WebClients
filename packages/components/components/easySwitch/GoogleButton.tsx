import { c } from 'ttag';

import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import { classnames } from '../../helpers';
import { Button, ButtonProps } from '../button';

const GoogleButton = ({ className, ...rest }: ButtonProps) => (
    <Button className={classnames(['inline-flex flex-justify-center', className])} {...rest}>
        <img src={googleLogo} alt="Google logo" className="mr0-5 flex-align-self-center" />
        {c('Action').t`Continue with Google`}
    </Button>
);

export default GoogleButton;
