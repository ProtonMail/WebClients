import chalk from 'chalk';

export const logIntro = (name: string) => {
    console.info('\n');
    console.info(`${chalk.bold.yellowBright('⚛')} Creating ${chalk.bold.yellowBright(name)} atom`);
    console.info('\n');
};

export const logItemCompletion = (successText: string) => {
    const checkMark = chalk.green('✓');
    console.info(`${checkMark} ${successText}`);
};

export const logConclusion = () => {
    console.info('\n');
    console.info(chalk.bold.green('Atom created! 🚀 '));
    console.info('\n');
};

export const logError = (error: string) => {
    console.info(chalk.bold.redBright('Error creating atom.'));
    console.info(chalk.redBright(error));
};

export const logComponentCreationError = (componentName: string) => {
    logError(`Component ${chalk.bold.redBright(componentName)} already exists.`);
};
