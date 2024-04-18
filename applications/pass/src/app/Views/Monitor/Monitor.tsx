import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Missing2FAs } from '@proton/pass/components/Monitor/2FA/Missing2FAs';
import { DuplicatePasswords } from '@proton/pass/components/Monitor/Password/DuplicatePasswords';
import { WeakPasswords } from '@proton/pass/components/Monitor/Password/WeakPasswords';
import { Summary } from '@proton/pass/components/Monitor/Summary';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const Monitor: FC<RouteChildrenProps> = ({ match }) => {
    const enabled = useFeatureFlag(PassFeature.PassMonitor);

    return (
        enabled && (
            <div className="w-full h-full">
                <div className="flex flex-1 flex-column items-start w-full h-full">
                    <Switch>
                        <Route exact path={`${match?.path}/duplicates`} component={DuplicatePasswords} />
                        <Route exact path={`${match?.path}/missing`} component={Missing2FAs} />
                        <Route exact path={`${match?.path}/weak`} component={WeakPasswords} />
                        <Route component={Summary} />
                    </Switch>
                </div>
            </div>
        )
    );
};
