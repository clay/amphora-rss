# Amphora RSS

[![CircleCI](https://circleci.com/gh/clay/amphora-rss/tree/master.svg?style=svg)](https://circleci.com/gh/clay/amphora-rss/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/clay/amphora-rss/badge.svg?branch=master)](https://coveralls.io/github/clay/amphora-rss?branch=master)

## Notice
This is a pre-1.x version of the renderer and the API is subject to change. It's recommended to install a specific version of the package until a stable API is reached.

## Install
`$ npm install --save amphora-rss`

## Use Case

The primary use case for this renderer is when you want to use component instances to generate RSS feeds. Using this renderer, you can turn feeds into components that can be edited through the Kiln interface to effectively move feed generation to component configuration.

## How To

This renderer is highly dependent on the component API provided by Amphora and therefore relies on a component that can generate a feed of documents to be passed off to the renderer. Here's an example implementation

  - An `rss-feed` component stores within itself _the logic to query some service that generates feeds_ and _stores the results within its own instance data_.
  - Using the [renderer specific `model.js` file](https://github.com/clay/amphora/pull/480) the data of the component is trimmed down into an object with two specific properties:
    - `feed`: an Array of objects (read below for structure specification)
    - `meta`: an Object with properties that will be used in generating RSS meta tags at the top of the feed
  - The data is passed to this render which turns feed data into an RSS document

## Data Specification

## Updating Namespaces
 This renderer has default namespaces which gets injected at the top of the rss feed. These namespaces are contained inside of the `defaultNamespaces` object. The namespaces can be overridden, removed or extended by attaching namespaces to the `attr` object. Since we merge this `attr` with `defaultNamespaces` and remove null values, attr keys with null values will not be included in the feed. attr keys with different namespaces will be added as an additional namespace to the feed. If a key holds the same namespace which exists within `defaultNamespaces` (and the value is not null) we will use the value of the attr namespace.
 - To remove a default namespace, set the value of that namespace to `null` inside the `attr` object. To modify a namespace, change the value of that similar namespace inside the `attr` object. To add a new namespace, add a key:value pair to the `attr` object where the key is a namespace that isn't used within `defaultNamespaces`, and the value is the url.
  - ```
  defaultNamespaces: {
      version: '2.0',
      'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
      'xmlns:mi': 'http://schemas.ingestion.microsoft.com/common/',
      'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
      }

  attr: {
      "xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd", <!-- this will be an additional namespace in our feed -->
      "xmlns:mi": null, <!-- this will be removed from our feed -->
      "xmlns:dc": "http://purl.org/dc/elements/2.1/", <!-- this will override and be the updated namespace -->
      }
  ```

### `feed` Array

At it's core, this renderer is a wrapper around the [`xml` package](https://www.npmjs.com/package/xml) to build the XML for the feed. This means that it is the responsibility of the renderer specific `model.js` file to create a `feed` object that abides by the API of this package. Refer to the package [README](https://github.com/dylang/node-xml/blob/master/readme.md) for structure of this array.

### Meta

The `meta` object is a very simple object composed of few properties which are used in composition of the XML.

- `title`: a string rendered in the `<title>` tag of the XML document
- `description`: a string rendered in the `<description>` tag of the XML document
- `link`: a string rendered in the `<link>` tag of the XML document
- `copyright` _(optional)_: a string or number rendered in the `<copyright>` tag of the XML document. If not provided, the current year will be used.
- `generator` _(optional)_: a string rendered in the `<generator>` tag of the XML document. Defaults to `Feed delivered by Clay`.
- `docs`: a string rendered in the `<docs>` tag of the XML document. Defaults to `http://blogs.law.harvard.edu/tech/rss`.
