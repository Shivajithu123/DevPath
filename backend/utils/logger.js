const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

const colors = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
}

function timestamp() {
  return new Date().toISOString()
}

function shouldLog(level) {
  return LEVELS[level] >= LEVELS[LOG_LEVEL]
}

function format(level, context, message, meta) {
  const color = { debug: colors.dim, info: colors.green, warn: colors.yellow, error: colors.red }[level]
  const label = `[${level.toUpperCase().padEnd(5)}]`
  const ctx   = context ? `${colors.cyan}[${context}]${colors.reset}` : ''
  const ts    = `${colors.dim}${timestamp()}${colors.reset}`
  const msg   = `${color}${label}${colors.reset} ${ts} ${ctx} ${message}`

  if (meta) {
    return `${msg}\n${colors.dim}${JSON.stringify(meta, null, 2)}${colors.reset}`
  }
  return msg
}

const logger = {
  debug: (context, message, meta) => {
    if (shouldLog('debug')) console.debug(format('debug', context, message, meta))
  },
  info: (context, message, meta) => {
    if (shouldLog('info')) console.info(format('info', context, message, meta))
  },
  warn: (context, message, meta) => {
    if (shouldLog('warn')) console.warn(format('warn', context, message, meta))
  },
  error: (context, message, err, meta) => {
    if (!shouldLog('error')) return
    console.error(format('error', context, message))
    if (err instanceof Error) {
      console.error(`${colors.red}  Message : ${err.message}${colors.reset}`)
      console.error(`${colors.dim}  Stack   :\n${err.stack}${colors.reset}`)
    }
    if (meta) {
      console.error(`${colors.dim}  Context : ${JSON.stringify(meta, null, 2)}${colors.reset}`)
    }
  },
}

module.exports = logger