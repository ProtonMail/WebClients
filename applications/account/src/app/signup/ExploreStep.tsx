import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Logo, classnames, useLoading } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
}

const ExploreStep = ({ onExplore }: Props) => {
    const [type, setType] = useState<APP_NAMES | undefined>(undefined);
    const [loading, withLoading] = useLoading();
    return (
        <Main>
            <Header title={c('new_plans: title').t`Start exploring the ${BRAND_NAME} universe`} />
            <Content>
                <ul className="unstyled m0 divide-y">
                    {[APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE, APPS.PROTONVPN_SETTINGS].map((app) => {
                        const name = getAppName(app);
                        const showLoader = type === app && loading;
                        return (
                            <li key={app}>
                                <Button
                                    loading={showLoader}
                                    data-testid={app.replace('proton-', 'explore-')}
                                    size="large"
                                    shape="ghost"
                                    className={classnames(['flex flex-align-items-center text-left my0-5'])}
                                    fullWidth
                                    onClick={() => {
                                        if (loading) {
                                            return;
                                        }
                                        setType(app);
                                        withLoading(onExplore(app));
                                    }}
                                >
                                    <Logo
                                        appName={app}
                                        size={60}
                                        variant="glyph-only"
                                        className="flex-item-noshrink mr0-5"
                                        aria-hidden="true"
                                    />{' '}
                                    <span className="flex-item-fluid">{name}</span>
                                    {!showLoader && (
                                        <span className="flex-item-noshrink" aria-hidden="true">
                                            <Icon name="arrow-right" />
                                        </span>
                                    )}
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </Content>
        </Main>
    );
};

export default ExploreStep;
