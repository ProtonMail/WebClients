import type { PassSaga } from '@proton/pass/store/types';

import offlineResume from './client/offline-resume.saga';
import offlineToggle from './client/offline-toggle.saga';
import breachesAlias from './monitor/breaches.alias.saga';
import breachesCustom from './monitor/breaches.custom.saga';
import breachesProton from './monitor/breaches.proton.saga';
import breaches from './monitor/breaches.saga';
import customAddressAdd from './monitor/custom-address.add.saga';
import customAddressDelete from './monitor/custom-address.delete';
import customAddressResend from './monitor/custom-address.resend';
import customAddressVerify from './monitor/custom-address.verify';
import monitorAddressResolve from './monitor/monitor-address.resolve.saga';
import monitorAddressToggle from './monitor/monitor-address.toggle.saga';
import monitorToggle from './monitor/monitor-toggle.saga';
import sentinelToggle from './monitor/sentinel-toggle.saga';

export const WEB_SAGAS: PassSaga[] = [
    breaches,
    breachesAlias,
    breachesCustom,
    breachesProton,
    customAddressAdd,
    customAddressDelete,
    customAddressResend,
    customAddressVerify,
    monitorAddressResolve,
    monitorAddressToggle,
    monitorToggle,
    offlineResume,
    offlineToggle,
    sentinelToggle,
];
