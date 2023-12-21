import { PASS_EOY_DATE_END, PASS_EOY_PATH, PASS_UPGRADE_PATH } from '@proton/pass/constants';

export const isEOY = () => +new Date() < PASS_EOY_DATE_END;
export const getUpgradePath = () => (isEOY() ? PASS_EOY_PATH : PASS_UPGRADE_PATH);
