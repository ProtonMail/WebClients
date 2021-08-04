import { c } from 'ttag';
import noAccessErrorSvg from '@proton/styles/assets/img/errors/no-access-page.svg';
import IllustrationPlaceholder from '../illustration/IllustrationPlaceholder';

const AccessDeniedError = () => {
    return <IllustrationPlaceholder title={c('Error message').t`Access denied`} url={noAccessErrorSvg} />;
};

export default AccessDeniedError;
