
'use strict';

const clayLog = require('clay-log'),
  pkg = require('../package.json');
var amphoraRssLogInstance;

/**
 * Initialize the logger
 */
function init() {
  if (amphoraRssLogInstance) {
    return;
  }

  // Initialize the logger
  clayLog.init({
    name: 'amphora-rss',
    prettyPrint: true,
    meta: {
      amphoraRss: pkg.version
    }
  });

  // Store the instance
  amphoraRssLogInstance = clayLog.getLogger();
}

/**
 * Setup new logger for a file
 *
 * @param  {Object} meta
 * @return {Function}
 */
function setup(meta = {}) {
  return clayLog.meta(meta, amphoraRssLogInstance);
}

/**
 * Set the logger instance
 * @param {Object|Function} replacement
 */
function setLogger(replacement) {
  amphoraRssLogInstance = replacement;
}

// Setup on first require
init();

module.exports.init = init;
module.exports.setup = setup;
module.exports.setLogger = setLogger;
