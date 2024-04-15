import { MINUTE } from '@proton/shared/lib/constants';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export const getMinuteJitter = () => randomIntFromInterval(0, 5) * MINUTE;
