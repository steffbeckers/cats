import Vue from 'vue'

/* eslint no-console: ["error", { allow: ["log", "info", "error", "count", "groupEnd", "profileEnd", "time", "timeEnd"] }] */
export default class Logger {
  debug = localStorage.getItem('debug') || process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development'

  log(...args) {
    if (this.debug) console.log.apply(console, JSON.parse(JSON.stringify(args)))
  }

  info(...args) {
    if (this.debug) console.info.apply(console, args)
  }

  error(...args) {
    if (this.debug) console.error.apply(console, args)
  }

  count(arg) {
    if (this.debug) console.count(arg)
  }

  group(arg) {
    if (this.debug) console.count(arg)
  }

  groupEnd() {
    if (this.debug) console.groupEnd()
  }

  profile(arg) {
    if (this.debug) console.count(arg)
  }

  profileEnd() {
    if (this.debug) console.profileEnd()
  }

  time(arg) {
    if (this.debug) console.time(arg)
  }

  timeEnd(arg) {
    if (this.debug) console.timeEnd(arg)
  }
}

Vue.prototype.$logger = new Logger()
