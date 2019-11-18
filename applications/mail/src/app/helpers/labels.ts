import { LABEL_IDS_TO_HUMAN } from '../constants';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;
