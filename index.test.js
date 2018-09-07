'use strict';

const _ = require('lodash'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  { expect } = require('chai'),
  sinon = require('sinon');

describe(_.startCase(filename), function () {
  let sandbox, logSpy;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    logSpy = sandbox.spy();

    lib.setLog(logSpy);
  });

  afterEach(function () {
    sandbox.restore();
  });

  function makeFakeRes() {
    return {
      type: sandbox.spy(),
      send: sandbox.spy(),
      status: sandbox.spy(),
      json: sandbox.spy()
    };
  }

  describe('render', function () {
    const fn = lib[this.title];

    it('returns an object with `output` and `type` properties', function () {
      const fakeRes = {
          type: sandbox.spy(),
          send: sandbox.spy()
        },
        result = fn({
          feed: [],
          meta: {
            title: 'foo',
            description: 'bar',
            link: 'foobar'
          }
        }, {}, fakeRes);

      return result.then(function () {
        sinon.assert.calledWith(fakeRes.type, 'text/rss+xml');
        sinon.assert.calledOnce(fakeRes.send);
      });
    });

    it('works', function () {
      const res = makeFakeRes(),
        result = fn({
          feed: [],
          meta: {}
        }, {}, res);


      result.then(function () {
        sinon.assert.calledWith(res.json, {status: 500, message: 'No data send to XML renderer, cannot respond'});
      });
    });
  });

  describe('wrapInItem', function () {
    const fn = lib[this.title];

    it('returns a passed in value as the value for an `item` property', function () {
      sinon.assert.match(fn('foo'), { item: 'foo' });
    });
  });

  describe('wrapInTopLevel', function () {
    const fn = lib[this.title],
      val = fn('foo'),
      customAttr = {bar: 'http://bar.com'},
      valWithAttr = fn('foo', customAttr);

    it('wraps the passed in value in an object with and rss array', function () {
      expect(Array.isArray(val.rss)).to.be.true;
    });

    it('has an object with an `_attr` property as the first object of the `rss` Array', function () {
      expect(val.rss[0]._attr).to.not.be.undefined;
    });

    it('merges attr instance data into the default namespace properties', function () {
      expect(valWithAttr.rss[0]._attr).to.have.property('bar', 'http://bar.com');
    });

    it('has an object with a `channel` property as the second object of the `rss` Array', function () {
      expect(val.rss[1].channel).to.not.be.undefined;
    });

    it('the value passed into the function is assigned to the `channel` property', function () {
      expect(val.rss[1].channel).to.eql('foo');
    });
  });

  describe('feedMetaTags', function () {
    const fn = lib[this.title];

    it('returns a function', function () {
      const result = fn({title:'foo', description: 'bar', link: 'foobar'});

      expect(result).to.be.an('function');
    });

    it('its callback returns an array', function () {
      const result = fn({title:'foo', description: 'bar', link: 'foobar'});

      expect(result([])).to.be.an('array');
    });

    it('its callback assigns passed in values to the return array', function () {
      const [ one, two, three ] = fn({title:'foo', description: 'bar', link: 'foobar'})([]);

      expect(one.title).to.eql('foo');
      expect(two.description).to.eql('bar');
      expect(three.link).to.eql('foobar');
    });

    it('accepts an `opt` object with additional meta tags', function () {
      const language = {language: 'en-US'},
        result = fn({title:'foo', description: 'bar', link: 'foobar', opt: language})([]);

      expect(result).have.to.deep.include(language);
    });
  });

  describe('elevateCategory', function () {
    const fn = lib[this.title];

    it('returns strings of category tags from each item\'s categories', function () {
      var result = fn([{item: [{ category: 'foo'}, { category: 'bar'}]}]);

      expect(result).to.eql([ { category: 'foo,bar' } ]);
    });

    it('returns an empty array if none of the items have categories', function () {
      var result = fn([{item: [{ notCategory: 'foo'}, { notCategory: 'bar'}]}]);

      expect(result).to.eql([]);
    });
  });
});
