import Winston, { Logger } from 'winston';
import * as path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'debug';
const SINGLE_LINE_FORMAT = Winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level.toUpperCase()} - ${message}`;
});

export const logger = (fileName: string): Logger => {
  return Winston.createLogger({
    level: LOG_LEVEL,
    format: Winston.format.combine(Winston.format.label({ label: path.basename(fileName) }), Winston.format.timestamp(), SINGLE_LINE_FORMAT),
    transports: [new Winston.transports.Console()],
  });
};
