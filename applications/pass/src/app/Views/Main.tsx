import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { Button } from '@proton/atoms/Button';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { Content } from '@proton/pass/components/Layout/Section/Content';

import { useAuthService } from '../Context/AuthServiceProvider';
import { authenticatedPath } from '../helpers/authenticatedPath';
import { ItemEditContainer } from './Item/ItemEditContainer';
import { ItemNewContainer } from './Item/ItemNewContainer';
import { ItemViewContainer } from './Item/ItemViewContainer';

export const Main: FC = () => {
    const authService = useAuthService();

    return (
        <LobbyLayout overlay>
            <main className="h-full w-full flex flex-column gap-4 flex-align-items-center flex-justify-center">
                <h4>Logged in to Pass</h4>

                <Content>
                    <Switch>
                        {/*TODO Make Route be reusable for extension */}
                        <Route
                            exact
                            path={[
                                authenticatedPath('/share/:shareId/item/:itemId'),
                                authenticatedPath('/trash/share/:shareId/item/:itemId'),
                            ]}
                        >
                            <ItemViewContainer />
                        </Route>

                        <Route exact path={authenticatedPath('/share/:shareId/item/:itemId/edit')}>
                            <ItemEditContainer />
                        </Route>

                        <Route exact path={authenticatedPath('/share/:activeShareId/item/new/:itemType')}>
                            <ItemNewContainer />
                        </Route>
                    </Switch>
                </Content>
                <Button pill shape="solid" color="weak" onClick={() => authService.logout({ soft: false })}>
                    Logout
                </Button>
            </main>
        </LobbyLayout>
    );
};
