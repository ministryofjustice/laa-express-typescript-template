/**
 * @file Displays an ASCII Art banner on application startup.
 * Uses `figlet` for ASCII rendering and `chalk` for color formatting.
 */

import figlet from 'figlet';
import chalk from 'chalk';
import type { Config } from '#types/config-types.js';

/**
 * Displays an ASCII Art banner with department name in the console.
 * @param {import('#types/config-types.js').Config} config - The application config object
 * @returns {void}
 */
const displayAsciiBanner = (config: Config): void => {
    figlet(config.SERVICE_NAME ?? 'Service', (err: Error | null, data?: string) => {
        if (err !== null) {
            console.error('❌ Error generating ASCII art:', err);
            return;
        }

        if (data === undefined || data === '') {
            console.error('❌ No ASCII art data generated');
            return;
        }

        console.clear(); // Clears terminal for a fresh display
        console.log(chalk.blue.bold(data)); // Render ASCII Art in blue
        console.log(chalk.green('Server is running at:'));
        console.log(chalk.cyan.underline(`http://localhost:${config.app.port}`)); // Clickable link in most terminals
    });
};

// Export the function for use in other files
export { displayAsciiBanner };