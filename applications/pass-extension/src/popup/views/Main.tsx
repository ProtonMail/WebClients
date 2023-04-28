import { type VFC, memo, useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { useNotifications } from '@proton/components/hooks';

import { FadeIn } from '../../shared/components/animation/FadeIn';
import { Header } from '../components/Header/Header';
import { Content } from '../components/Layout/Content';
import { Sidebar } from '../components/Layout/Sidebar';
import { ItemEditContainer } from './Item/ItemEditContainer';
import { ItemNewContainer } from './Item/ItemNewContainer';
import { ItemViewContainer } from './Item/ItemViewContainer';
import { ItemsList } from './Sidebar/ItemsList';
import { TrashItemsList } from './Sidebar/TrashItemsList';

import './Main.scss';

const MainRaw: VFC = () => {
    const { clearNotifications } = useNotifications();
    useEffect(() => () => clearNotifications(), []);

    return (
        <FadeIn id="main" className="flex flex-column flex-nowrap w100 h100 overflow-hidden" key="main">
            <Header />
            <main className="flex flex-align-items-center flex-justify-center flex-nowrap w100 h100">
                <Sidebar>
                    <Switch>
                        <Route path="/trash">
                            <TrashItemsList />
                        </Route>
                        <Route>
                            <ItemsList />
                        </Route>
                    </Switch>
                </Sidebar>

                <Content>
                    <Switch>
                        <Route exact path={['/share/:shareId/item/:itemId', '/trash/share/:shareId/item/:itemId']}>
                            <ItemViewContainer />
                        </Route>

                        <Route exact path="/share/:shareId/item/:itemId/edit">
                            <ItemEditContainer />
                        </Route>

                        <Route exact path="/item/new/:itemType">
                            <ItemNewContainer />
                        </Route>
                    </Switch>
                </Content>
            </main>
        </FadeIn>
    );
};

export const Main = memo(MainRaw, () => true);
