import { type FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { FadeIn } from '@proton/pass/components/Layout/Animation/FadeIn';
import { Content } from '@proton/pass/components/Layout/Section/Content';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';

import { useAuthService } from '../Context/AuthServiceProvider';
import { PrivateRoutes } from '../Routing/PrivateRoutes';
import { Items } from './Sidebar/Items';

export const Main: FC = () => {
    const authService = useAuthService();

    return (
        <FadeIn id="main" className="flex flex-column flex-nowrap w-full h-full overflow-hidden" key="main" delay={50}>
            <main className="flex flex-align-items-center flex-justify-center flex-nowrap w-full h-full">
                <Sidebar>
                    <Items />
                    <Button shape="ghost" color="weak" onClick={() => authService.logout({ soft: false })}>
                        Logout
                    </Button>
                </Sidebar>
                <Content>
                    <PrivateRoutes />
                </Content>
            </main>
        </FadeIn>
    );
};
