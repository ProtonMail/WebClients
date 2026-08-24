import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useOfflineSetup } from '../../hooks/auth/useOfflineSetup';
import { selectOfflineEnabled } from '../../store/selectors';
import { pipe } from '../../utils/fp/pipe';
import { useOnline } from '../Core/ConnectivityProvider';
import type { BaseSpotlightMessage } from '../Spotlight/SpotlightContent';

export const OfflineSetup: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const online = useOnline();
    const [setup] = useOfflineSetup();
    const offlineEnabled = useSelector(selectOfflineEnabled);

    useEffect(() => {
        if (offlineEnabled) onClose();
    }, [offlineEnabled]);

    return (
        <>
            <div className="flex-1">
                <strong className="block">{c('Title').t`Setup offline mode`}</strong>
                <span className="block text-sm">
                    {c('Info')
                        .t`Enable offline mode to access your ${PASS_SHORT_APP_NAME} data if you lose internet connectivity or if ${BRAND_NAME} servers are unreachable.`}
                </span>
                <div className="mt-2">
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        size="small"
                        className="text-sm px-3"
                        onClick={pipe(onClose, setup)}
                        disabled={!online}
                    >
                        {c('Action').t`Enable`}
                    </Button>
                </div>
            </div>
        </>
    );
};
