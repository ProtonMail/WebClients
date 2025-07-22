const express = require('express');

const PORT = process.env.HTTP_DEBUGGER_PORT || 3000;

const ANSI_COLORS = {
    CYAN: '\x1b[36m',
    GRAY: '\x1b[90m',
    PURPLE: '\x1b[35m',
    RED: '\x1b[31m',
    RESET: '\x1b[0m',
    YELLOW: '\x1b[33m',
};

const LOG_COLORS = {
    info: ANSI_COLORS.CYAN,
    warning: ANSI_COLORS.YELLOW,
    error: ANSI_COLORS.RED,
    log: ANSI_COLORS.CYAN,
    debug: ANSI_COLORS.PURPLE,
};

const writeLog = (type, date, message) =>
    console.log(
        `${ANSI_COLORS.PURPLE}[${type}]${ANSI_COLORS.RESET}`,
        `${ANSI_COLORS.GRAY}${new Date(date).toISOString()}${ANSI_COLORS.RESET}`,
        `${LOG_COLORS[type] || LOG_COLORS.log}${message}${ANSI_COLORS.RESET}`
    );

const handleLog = (req, res) => {
    try {
        const { date, message, type = 'log' } = JSON.parse(decodeURIComponent(req.query.message));
        writeLog(type, date, message);
    } catch {}

    res.status(200).send('OK');
};

module.exports = () => {
    const app = express();
    app.get('/log', handleLog);
    app.listen(PORT, () => writeLog('info', new Date(), `Listening on :${PORT}\x1b[0m`));
};
