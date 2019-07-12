import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Button, Group, ButtonGroup, Icon, Select } from 'react-components';

const Toolbar = ({ onToday, onPrev, onNext, view, onChangeView }) => {
    const views = [
        { text: c('Calendar view').t`Day`, value: 'day' },
        { text: c('Calendar view').t`Week`, value: 'week' },
        { text: c('Calendar view').t`Month`, value: 'month' },
        { text: c('Calendar view').t`Year`, value: 'year' },
        { text: c('Calendar view').t`Planning`, value: 'planning' }
    ];

    const handleChangeView = ({ target }) => onChangeView(target.value);

    return (
        <div className="flex flex-nowrap">
            <Button className="mr1" onClick={onToday}>{c('Action').t`Today`}</Button>
            <Group className="mr1">
                <ButtonGroup onClick={onPrev}>
                    <Icon name="arrow-left" />
                </ButtonGroup>
                <ButtonGroup onClick={onNext}>{<Icon name="arrow-right" />}</ButtonGroup>
            </Group>
            <div>
                <Select options={views} value={view} onChange={handleChangeView} />
            </div>
        </div>
    );
};

Toolbar.propTypes = {
    onToday: PropTypes.func,
    onPrev: PropTypes.func,
    onNext: PropTypes.func,
    view: PropTypes.string,
    onChangeView: PropTypes.func
};

export default Toolbar;
