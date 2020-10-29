import { EVENT_VERIFICATION_STATUS } from '../../calendar/interface';
import { VcalVeventComponent } from './VcalModel';

export type DecryptedVeventResult = {
    veventComponent: VcalVeventComponent;
    verificationStatus: EVENT_VERIFICATION_STATUS;
};
export type DecryptedPersonalVeventMapResult = { [memberID: string]: DecryptedVeventResult | undefined };
