import { Whitelist } from '../whitelist';
import test from 'ava';

test('Simple matches', (t) => {
  const wl = new Whitelist(['abc', 'def']);

  t.true(wl.allows('abc'));
  t.true(wl.allows('def'));

  t.false(wl.allows('xyz'));
  t.false(wl.allows('ab'));
  t.false(wl.allows('abcd'));
});

test('Overlapping Whitelists', (t) => {
  const wl = new Whitelist(['ab', 'abc']);

  t.true(wl.allows('ab'));
  t.true(wl.allows('abc'));

  t.false(wl.allows('a'));
  t.false(wl.allows('abcd'));
});

test('Overlapping Whitelist rev', (t) => {
  const wl = new Whitelist(['abc', 'ab']);

  t.true(wl.allows('ab'));
  t.true(wl.allows('abc'));

  t.false(wl.allows('a'));
  t.false(wl.allows('abcd'));
});

test('Wildcarding Whitelist', (t) => {
  const wl = new Whitelist(['ab*']);

  t.true(wl.allows('ab'));
  t.true(wl.allows('abc'));
  t.true(wl.allows('abcd'));
  t.true(wl.allows('abcde'));

  t.false(wl.allows('a'));
  t.false(wl.allows('dab'));
});

test('Appending Wildcard', (t) => {
  const wl = new Whitelist(['abcd', 'ab*']);

  t.true(wl.allows('ab'));
  t.true(wl.allows('abc'));
  t.true(wl.allows('abcd'));
  t.true(wl.allows('abcde'));

  t.false(wl.allows('a'));
  t.false(wl.allows('dab'));
});
