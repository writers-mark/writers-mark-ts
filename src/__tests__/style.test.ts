import rewire = require('rewire');

import { Options, makeInternalOptions } from '../options';
import test from 'ava';

/* tslint:disable:no-string-literal */

const Style = rewire('../style');

test('Basic style parsing', (t) => {
  const style = Style.compile('p aaa {}');
  t.is(Object.keys(style.paragraph).length, 2);
  t.deepEqual(style.paragraph['aaa'].props, {});
  t.is(Object.keys(style.span).length, 0);
});

test('Safety net', (t) => {
  const allowValue = Style.__get__('allowValue');
  t.false(allowValue('color', 'r\\65 d'));
  t.false(allowValue('color', 'url("http://example.com")'));
  t.false(allowValue('color', 'u\\72 l("http://example.com")'));
  t.false(allowValue('color', 'red; background-color: blue'));

  t.true(allowValue('color', ''));
  t.true(allowValue('color', 'red'));
  t.true(allowValue('color', '#abcd'));
});

const emptyOpts: Options = {
  spanProps: [],
  pProps: [],
};

test('Parse empty string', (t) => {
  const style = Style.compile('', emptyOpts);

  t.is(Object.keys(style.paragraph).length, 1);
  t.is(Object.keys(style.span).length, 0);

  t.deepEqual(style.paragraph['default'].props, {});
});

test('Blank options whitelist', (t) => {
  const style = Style.compile('p aaa {color: red;}', {});
  t.deepEqual(style.paragraph['aaa'].props, { color: 'red' });
});

test('Parse empty p rule', (t) => {
  const style = Style.compile('p aaa {}', emptyOpts);

  t.is(Object.keys(style.paragraph).length, 2);
  t.is(Object.keys(style.span).length, 0);

  t.deepEqual(style.paragraph['aaa'].props, {});
});

test('Parse empty p rule (tight spacing', (t) => {
  const style = Style.compile('p aaa{}', emptyOpts);

  t.is(Object.keys(style.paragraph).length, 2);
  t.is(Object.keys(style.span).length, 0);

  t.deepEqual(style.paragraph['aaa'].props, {});
});

test('Parse empty s rule', (t) => {
  const style = Style.compile('s aaa {}', emptyOpts);

  t.is(Object.keys(style.paragraph).length, 1);
  t.is(Object.keys(style.span).length, 1);

  t.deepEqual(style.span['aaa'], { props: {} });
});

test('Parse terminated s rule', (t) => {
  const style = Style.compile('s aaa bbb {}', emptyOpts);

  t.is(Object.keys(style.paragraph).length, 1);
  t.is(Object.keys(style.span).length, 1);

  t.deepEqual(style.span['aaa'], {
    endPattern: 'bbb',
    props: {},
  });
});

test('Does not parse non-whitelisted property', (t) => {
  const style = Style.compile('s aaa {color: red;}', emptyOpts);
  t.deepEqual(style.span['aaa'].props, {});
});

const opts: Options = {
  pProps: ['color', 'font', 'margin*', 'font-weight'],
  spanProps: ['body'],
};

test('Parses a whitelisted property', (t) => {
  const style = Style.compile('p aaa {color: red;} s bbb {body: blue;}', opts);
  t.deepEqual(style.paragraph['aaa'].props, { color: 'red' });
  t.deepEqual(style.span['bbb'].props, { body: 'blue' });
});

test('Modify default rule', (t) => {
  const style = Style.compile('p default {color: red;}', opts);

  t.is(Object.keys(style.paragraph).length, 1);
  t.deepEqual(style.paragraph['default'].props, { color: 'red' });
});

test('No cross-talk between whitelists', (t) => {
  const style = Style.compile('p aaa {body: red;} s bbb {color: blue;}', opts);
  t.deepEqual(style.paragraph['aaa'].props, {});
  t.deepEqual(style.span['bbb'].props, {});
});

test('Parses a multiple properties', (t) => {
  const style = Style.compile('p aaa {color: red; font: arial;}', opts);
  t.deepEqual(style.paragraph['aaa'].props, {
    color: 'red',
    font: 'arial',
  });
});

test('Accepts the last set value', (t) => {
  const style = Style.compile('p aaa {color: red; color: blue;}', opts);
  t.deepEqual(style.paragraph['aaa'].props, {
    color: 'blue',
  });
});

test('Works with hyphenated properties', (t) => {
  const style = Style.compile('p aaa {font-weight: bold;}', opts);
  t.deepEqual(style.paragraph['aaa'].props, {
    'font-weight': 'bold',
  });
});

test('Allows wildcard whitelist', (t) => {
  const style = Style.compile('p aaa {margin: 1; margin-left: 2;}', opts);
  t.deepEqual(style.paragraph['aaa'].props, {
    margin: '1',
    'margin-left': '2',
  });
});

test('Ignores giberish between rules', (t) => {
  const style = Style.compile('p aaa {} ajlksnfaksd p bbb {}', opts);
  t.deepEqual(style.paragraph['aaa'].props, {});
  t.deepEqual(style.paragraph['bbb'].props, {});
});
