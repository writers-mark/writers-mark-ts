import * as style from '../style';
import test from 'ava';
import { Options } from '../options';

/* tslint:disable:no-string-literal */

const opts: Options = {
  pProps: ['aaa'],
  spanProps: ['bbb'],
};

test('Needs default style', (t) => {
  t.false(style.isValid({ paragraph: {}, span: {} }, opts));
});

test('Minimal default style', (t) => {
  t.true(style.isValid({ paragraph: { default: { props: {} } }, span: {} }, opts));
});

test('Valid p prop', (t) => {
  t.true(
    style.isValid(
      {
        paragraph: {
          default: { props: {} },
          test: { props: { aaa: '12' } },
        },
        span: {},
      },
      opts,
    ),
  );
});

test('Invalid p prop', (t) => {
  t.false(
    style.isValid(
      {
        paragraph: {
          default: { props: {} },
          test: { props: { bbb: '12' } },
        },
        span: {},
      },
      opts,
    ),
  );
});

test('Sneaky p prop injection', (t) => {
  t.false(
    style.isValid(
      {
        paragraph: {
          default: { props: {} },
          test: { props: { aaa: '12; background: red' } },
        },
        span: {},
      },
      opts,
    ),
  );
});

test('Valid span prop', (t) => {
  t.true(
    style.isValid(
      {
        paragraph: {
          default: { props: {} },
        },
        span: {
          test: { props: { bbb: '12' } },
        },
      },
      opts,
    ),
  );
});

test('Invalid span prop', (t) => {
  t.false(
    style.isValid(
      {
        paragraph: {
          default: { props: {} },
        },
        span: {
          test: { props: { aaa: '12' } },
        },
      },
      opts,
    ),
  );
});

test('Sneaky span prop injection', (t) => {
  t.false(
    style.isValid(
      {
        paragraph: {
          default: { props: {} },
        },
        span: {
          test: { props: { bbb: '12; background: red' } },
        },
      },
      opts,
    ),
  );
});

test('Use Default options', (t) => {
  t.false(style.isValid({ paragraph: {}, span: {} }));
});
