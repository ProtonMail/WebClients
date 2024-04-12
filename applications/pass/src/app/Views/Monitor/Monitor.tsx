import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { DuplicatePasswords } from '@proton/pass/components/Monitor/Password/DuplicatePasswords';
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
                        <Route component={Summary} />
                    </Switch>
                </div>
            </div>
        )
    );
};
