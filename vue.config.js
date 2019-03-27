process.env.VUE_APP_BUILD_DATETIME = new Date().toISOString();
process.env.VUE_APP_VERSION = require('./package.json').version
