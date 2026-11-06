import { Link, useHistory, useLocation } from 'react-router-dom';

import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { IcQuestionCircle } from '@proton/icons/icons/IcQuestionCircle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { PublicAppContext } from '../content/state-machine/PublicAppContext';
import { selectPaths, selectPreAppIntent } from '../content/state-machine/publicAppStateMachine';
import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';

const SigninHelpContainer = () => {
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const paths = PublicAppContext.useSelector(selectPaths, isDeepEqual);
    const history = useHistory();
    const location = useLocation();

    const handleBack = () => {
        history.push(paths.login);
    };

    return (
        <Layout toApp={toApp} onBack={handleBack} hasDecoration>
            <Main>
                <Header title={c('Title').t`Forgot password`} onBack={handleBack} />
                <Content className="text-center">
                    <Link
                        className="flex items-center gap-3 text-no-decoration color-norm hover:color-norm py-4 border-bottom border-weak"
                        to={paths.signinAnotherDevice}
                    >
                        <IcQrCode size={6} />
                        <div className="text-left flex-1">
                            <div className="text-lg">{c('edm').t`Sign in with QR code`}</div>
                            <div className="color-weak">{c('edm')
                                .t`Works if you have another device that’s signed in to ${BRAND_NAME}`}</div>
                        </div>
                    </Link>

                    <Link
                        className="flex items-center gap-3 text-no-decoration color-norm hover:color-norm py-4 border-bottom border-weak"
                        to={`${paths.reset}${location.search}`}
                    >
                        <IcKey size={6} />
                        <div className="text-left flex-1">
                            <div className="text-lg">{c('Action').t`Recover account`}</div>
                            <div className="color-weak">{c('Description')
                                .t`Use a recovery method to reset your password`}</div>
                        </div>
                    </Link>

                    <Href
                        className="flex items-center gap-3 text-no-decoration color-norm hover:color-norm py-4"
                        target="_blank"
                        href={getKnowledgeBaseUrl('/common-login-problems')}
                    >
                        <IcQuestionCircle size={6} />
                        <div className="text-left flex-1">
                            <div className="text-lg">{c('Title').t`Other sign-in issues`}</div>
                            <div className="color-weak">{c('Description').t`Learn more about common problems`}</div>
                        </div>
                        <IcArrowWithinSquare size={3.5} className="color-weak m-3" />
                    </Href>
                </Content>
            </Main>
        </Layout>
    );
};

export default SigninHelpContainer;
