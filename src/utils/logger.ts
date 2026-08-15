// ANSI escape codes for beautiful terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

export class Logger {
  private static getTimestamp(): string {
    const now = new Date();
    return `${colors.gray}[${now.toLocaleTimeString()}]${colors.reset}`;
  }

  public static info(message: string, ...args: unknown[]): void {
    console.log(`${this.getTimestamp()} ${colors.cyan}ℹ INFO${colors.reset}  ${message}`, ...args);
  }

  public static step(stepNumber: number, totalSteps: number, title: string): void {
    console.log(`\n${colors.bold}${colors.magenta}=== [Paso ${stepNumber}/${totalSteps}] ${title} ===${colors.reset}`);
  }

  public static success(message: string, ...args: unknown[]): void {
    console.log(`${this.getTimestamp()} ${colors.green}✔ ÉXITO${colors.reset} ${message}`, ...args);
  }

  public static warn(message: string, ...args: unknown[]): void {
    console.log(`${this.getTimestamp()} ${colors.yellow}⚠ AVISO${colors.reset} ${message}`, ...args);
  }

  public static error(message: string, ...args: unknown[]): void {
    console.error(`${this.getTimestamp()} ${colors.red}✖ ERROR${colors.reset} ${message}`, ...args);
  }

  public static banner(title: string, subtitle?: string): void {
    const line = '═'.repeat(65);
    console.log(`${colors.cyan}${line}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
    if (subtitle) {
      console.log(`${colors.dim}  ${subtitle}${colors.reset}`);
    }
    console.log(`${colors.cyan}${line}${colors.reset}\n`);
  }
}
