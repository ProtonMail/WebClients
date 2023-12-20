import { PASS_EOY_DATE_END } from '@proton/pass/constants';

export const isEOY = () => +new Date() < PASS_EOY_DATE_END;
