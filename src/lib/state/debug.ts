import chalk from 'chalk';


export default function debug(...args: Array<any>) {
  console.log(chalk.green('[npm-check] debug'));
  console.log.apply(console, ...args);
  console.log(`${chalk.green('===============================')}`);
}
