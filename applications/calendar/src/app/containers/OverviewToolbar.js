import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Group, ButtonGroup, Icon, Select } from 'react-components';
import moment from 'moment';
import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const OverviewToolbar = ({ onToday, onPrev, onNext, view, onChangeView }) => {
    const views = [
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH },
        { text: c('Calendar view').t`Year`, value: YEAR },
        { text: c('Calendar view').t`Agenda`, value: AGENDA }
    ];

    const handleChangeView = ({ target }) => onChangeView(target.value);
    const previous = {
        day: c('Action').t`Previous day`,
        week: c('Action').t`Previous week`,
        month: c('Action').t`Previous month`,
        year: c('Action').t`Previous year`
    }[view];
    const today = moment().format('LL');
    const next = {
        day: c('Action').t`Next day`,
        week: c('Action').t`Next week`,
        month: c('Action').t`Next month`,
        year: c('Action').t`Next year`
    }[view];

    return (
        <div className=" toolbar noprint">
            <div className="flex flex-spacebetween">
                <Group>
                    <ButtonGroup title={previous} onClick={onPrev}>
                        <Icon name="arrow-left" />
                    </ButtonGroup>
                    <ButtonGroup title={today} onClick={onToday}>{c('Action').t`Today`}</ButtonGroup>
                    <ButtonGroup title={next} onClick={onNext}>
                        <Icon name="arrow-right" />
                    </ButtonGroup>
                </Group>
                <div>
                    <Select
                        title={c('Action').t`Select calendar view`}
                        options={views}
                        value={view}
                        onChange={handleChangeView}
                    />
                </div>
            </div>
        </div>
    );
};

OverviewToolbar.propTypes = {
    onToday: PropTypes.func,
    onPrev: PropTypes.func,
    onNext: PropTypes.func,
    view: PropTypes.string,
    onChangeView: PropTypes.func
};

export default OverviewToolbar;
