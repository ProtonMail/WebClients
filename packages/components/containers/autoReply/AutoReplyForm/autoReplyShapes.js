import PropTypes from 'prop-types';

export const dateShape = PropTypes.shape({
    date: PropTypes.instanceOf(Date),
    time: PropTypes.instanceOf(Date),
    day: PropTypes.number
});

export const modelShape = PropTypes.shape({
    message: PropTypes.string,
    duration: PropTypes.number,
    daysOfWeek: PropTypes.arrayOf(PropTypes.number),
    timezone: PropTypes.string,
    subject: PropTypes.string,
    enabled: PropTypes.bool,
    start: dateShape,
    end: dateShape
});
