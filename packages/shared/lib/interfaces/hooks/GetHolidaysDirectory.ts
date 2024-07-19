import type { Api } from '../../interfaces/Api';
import type { HolidaysDirectoryCalendar } from '../calendar';

export type GetHolidaysDirectory = (api: Api) => Promise<HolidaysDirectoryCalendar[]>;
