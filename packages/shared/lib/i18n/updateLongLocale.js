import { dateLocale, setLocales } from './index';
import { loadDateFnTimeFormat } from './dateFnLocale';

export default ({ displayAMPM = false }) => {
    const locale = loadDateFnTimeFormat({ dateLocale, displayAMPM });
    setLocales({ dateLocale: locale });
};
