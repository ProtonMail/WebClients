import { Api } from '../../interfaces/Api';
import { HolidaysDirectoryCalendar } from '../calendar';

export type GetHolidaysDirectory = (api: Api) => Promise<HolidaysDirectoryCalendar[]>;
