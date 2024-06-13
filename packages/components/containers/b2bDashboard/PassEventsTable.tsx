import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Table, TableBody, TableHeader, TableRow, Time } from '@proton/components/components';

import { PassEvent } from '.';
import { getDesciptionText, getEventNameText } from './helpers';

interface Props {
    events: PassEvent[];
    loading: boolean;
    handleEventClick: (event: string) => void;
    handleTimeClick: (time: string) => void;
}

const PassEventsTable = ({ events, loading, handleEventClick, handleTimeClick }: Props) => {
    return (
        <Table responsive="cards">
            <TableHeader
                cells={[
                    c('Title').t`Time`,
                    c('Title').t`User`,
                    c('Title').t`Event`,
                    c('Title').t`Description`,
                    c('Title').t`IP`,
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, event, ip }, index) => {
                    const { name, email } = user;
                    const key = index;
                    const unixTime = new Date(time).getTime() / 1000;
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
                                <div className="flex flex-column">
                                    <span>{name}</span>
                                    <span className="color-weak">{email}</span>
                                </div>,
                                <Button
                                    onClick={() => handleEventClick(event)}
                                    color="weak"
                                    shape="solid"
                                    size="small"
                                    className=""
                                >
                                    {getEventNameText(event)}
                                </Button>,
                                <div className="flex flex-column">
                                    <span className="">{getDesciptionText(event)}</span>
                                </div>,
                                <div className="flex flex-column">
                                    <span>{ip}</span>
                                </div>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default PassEventsTable;
