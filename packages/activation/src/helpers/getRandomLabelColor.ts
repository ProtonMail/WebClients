import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export default () => ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)];
