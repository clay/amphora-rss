'use strict';

const h = require('highland'),
  xml = require('xml'),
  _findIndex = require('lodash/findIndex'),
  _get = require('lodash/get'),
  format = require('date-fns/format'),
  docsUrl = 'http://blogs.law.harvard.edu/tech/rss',
  generatorMessage = 'Feed delivered by Clay';

let log = require('./services/log').setup({ file: __filename });

/**
 * Elevate category tags into the
 * the top of the document
 *
 * @param  {Array} group
 * @return {Array}
 */
function elevateCategory(group) {
  return group
    .map(({ item }) => {
      return item
        .filter(entry => entry && entry.category)
        .map(entry => entry.category)
        .join(',');
    })
    .filter(Boolean)
    .map(string => ({ category: string }));
}

/**
 * Add the meta tags around the feed
 *
 * @param {Object} meta
 * @param {String} meta.title
 * @param {String} meta.description
 * @param {String} meta.link
 * @param {String|Number} [meta.copyright]
 * @param {String} [meta.generator]
 * @param {String} [meta.docs]
 * @param {Array}  [meta.opt]
 * @param {Object} [meta.image]
 * @param {Boolean}[meta.elevateChannelCategories=true]
 * @return {Function}
 */
function feedMetaTags({
  title,
  description,
  link,
  copyright,
  generator = generatorMessage,
  docs = docsUrl,
  opt,
  image,
  elevateChannelCategories = true
}) {
  return (group) => {
    if (!title || !description || !link) {
      throw new Error('A `title`, `description` and `link` property are all required in the `meta` object for the RSS renderer');
    }

    const now = new Date();
    let siteMeta = [
      { title },
      { description },
      { link },
      { lastBuildDate: format(now, 'ddd, DD MMM YYYY HH:mm:ss ZZ') },
      { docs },
      { copyright: copyright || now.getFullYear() },
      { generator }
    ];

    if (opt) {
      siteMeta = siteMeta.concat(opt);
    }

    if (image) {
      siteMeta = siteMeta.concat(formatImageTag(image.url, link, title));
    }

    const channelCats = elevateChannelCategories
      ? elevateCategory(group)
      : [];

    return siteMeta.concat(channelCats, group);
  };
}

/**
 * Remove falsy values from an object
 *
 * @param {Object} obj
 * @returns {Object}
 */
function cleanNullValues(obj) {
  for (let propName in obj) {
    if (!obj[propName]) {
      delete obj[propName];
    }
  }
  return obj;
}

/**
 * Wraps content in top level RSS and Channel tags
 *
 * @param {Array} data
 * @param {Object} attr
 * @returns {Object}
 */
function wrapInTopLevel(data, attr = {}) {
  const defaultNamespaces = {
    version: '2.0',
    'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
    'xmlns:mi': 'http://schemas.ingestion.microsoft.com/common/',
    'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    'xmlns:media': 'http://search.yahoo.com/mrss/'
  };

  return {
    rss: [
      { _attr: cleanNullValues(Object.assign(defaultNamespaces, attr)) },
      { channel: data }
    ]
  };
}

/**
 * Wrap each entry in an object under the `item` property
 *
 * @param {Array} entry
 * @returns {Object}
 */
function wrapInItem(entry) {
  if (entry.length) {
    const imageIndex = findIndexOfElementInArray(entry, 'image');
    if (imageIndex !== -1) {
      entry.splice(imageIndex, 1);
    }
  }
  return { item: entry };
}

function sendError(res, e, message = e.message) {
  const status = 500;
  res.status(status);
  res.json({ status, message });
  log('error', e.message, { stack: e.stack });
}

/**
 * Given the data object from Amphora, make the XML
 *
 * @param {Object} data
 * @param {Array}  data.feed
 * @param {Object} data.meta
 * @param {Object} data.attr
 * @param {Object} info
 * @param {Object} res
 * @returns {Promise}
 */
function render({ feed, meta, attr }, info, res) {
  if (feed.length) {
    const imageIndex = findIndexOfElementInArray(feed[0], 'image');
    const url = _get(feed[0][imageIndex], 'image.url');
    if (url) meta.image = { url };
  }

  return h(feed)
    .map(wrapInItem)
    .collect()
    .map(feedMetaTags(meta))
    .map(data => wrapInTopLevel(data, attr))
    .errors(e => sendError(res, e))
    .toPromise(Promise)
    .then(data => {
      if (!data) {
        throw new Error('No data sent to XML renderer, cannot respond');
      }
      res.type('text/rss+xml');
      res.send(xml(data, { declaration: true, indent: '\t' }));
    })
    .catch(e => sendError(res, e));
}

/**
 * Finds the index of a given element in an array.
 *
 * @param {Array} array
 * @param {String} element
 * @returns {number}
 */
function findIndexOfElementInArray(array, element) {
  return _findIndex(array, (item) => item[element]);
}

/**
 * Formats image tag on the rss feed.
 *
 * @param {String} url
 * @param {String} link
 * @param {String} title
 * @returns {Object}
 */
function formatImageTag(url, link, title) {
  return {
    image: [
      { url },
      { link },
      { title }
    ]
  };
}

module.exports.render = render;
module.exports.wrapInItem = wrapInItem;
module.exports.wrapInTopLevel = wrapInTopLevel;
module.exports.feedMetaTags = feedMetaTags;
module.exports.elevateCategory = elevateCategory;
module.exports.cleanNullValues = cleanNullValues;
module.exports.setLog = (fake) => (log = fake);
