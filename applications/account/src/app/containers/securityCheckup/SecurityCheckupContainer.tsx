import { Redirect } from 'react-router-dom';

import { useIsSecurityCheckupAvailable, useSecurityCheckup } from '@proton/components';

import AccountLoaderPage from '../../content/AccountLoaderPage';
import SecurityCheckupRouter from './SecurityCheckupRouter';

import './SecurityCheckup.scss';

const SecurityCheckupContainer = () => {
    const securityCheckup = useSecurityCheckup();
    const isSecurityCheckupAvailable = useIsSecurityCheckupAvailable();

    if (!isSecurityCheckupAvailable) {
        return <Redirect to="/" />;
    }

    if (securityCheckup.loading) {
        return <AccountLoaderPage />;
    }

    return <SecurityCheckupRouter />;
};

export default SecurityCheckupContainer;
