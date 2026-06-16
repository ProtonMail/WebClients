/* eslint-env jest */

/**
 * Manual mock for `loglevel` used by pass jest setups (`jest.mock('loglevel', () => require(...))`).
 */
const createLoglevelMock = () => {
    const logger: any = {
        methodFactory: jest.fn(),
        setLevel: jest.fn(),
        setDefaultLevel: jest.fn(),
        getLevel: jest.fn(),
        enableAll: jest.fn(),
        disableAll: jest.fn(),
        rebuild: jest.fn(),
        trace: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        log: jest.fn(),
    };

    logger.getLogger = jest.fn(() => logger);
    logger.getLoggers = jest.fn(() => ({}));

    return logger;
};

export default createLoglevelMock();
