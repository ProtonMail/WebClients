import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { Table, TableBody, TableHeader, TableRow, Time } from '../../../components';
import { type CountryOptions, getLocalizedCountryByAbbr } from '../../../helpers/countries';
import { getVPNEventColor } from './helpers';
import type { VPNEvent } from './interface';

interface Props {
    events: VPNEvent[];
    loading: boolean;
    handleEventClick: (event: string) => void;
    handleTimeClick: (time: string) => void;
    getEventTypeText: (eventType: string) => string;
    countryOptions: CountryOptions;
}

const VPNEventsTable = ({
    events,
    loading,
    handleEventClick,
    handleTimeClick,
    getEventTypeText,
    countryOptions,
}: Props) => {
    return (
        <Table responsive="cards">
            <TableHeader
                cells={[
                    c('Title').t`Time`,
                    c('Title').t`User`,
                    c('Title').t`Event`,
                    c('Title').t`Origin`,
                    c('Title').t`Gateway`,
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, event, origin, gateway }, index) => {
                    const { name, email } = user;
                    const { name: gatewayName, emoji } = gateway;
                    const { location, ip } = origin;
                    const key = index;
                    const unixTime = getUnixTime(new Date(time));
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <Button
                                    onClick={() => handleTimeClick(time)}
                                    color="weak"
                                    size="small"
                                    shape="ghost"
                                    className="px-1"
                                >
                                    <Time format="PPp">{unixTime}</Time>
                                </Button>,
                                <div className="flex flex-column flex-nowrap">
                                    <span>{name}</span>
                                    <span className="color-weak">{email}</span>
                                </div>,
                                <Button
                                    onClick={() => handleEventClick(event)}
                                    color={getVPNEventColor(event)}
                                    shape="solid"
                                    size="small"
                                >
                                    {getEventTypeText(event)}
                                </Button>,
                                <div className="flex flex-column flex-nowrap">
                                    <span>{ip}</span>
                                    <span className="color-weak">
                                        {getLocalizedCountryByAbbr(location, countryOptions)}
                                    </span>
                                </div>,
                                <div className="flex flex-column">
                                    <span>{gatewayName}</span>
                                    <span>{emoji}</span>
                                </div>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default VPNEventsTable;
