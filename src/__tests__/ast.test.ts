import * as style from '../style';
import * as ast from '../ast';
import test from 'ava';

const testStyle = style.compile(
  'p aaa {color: red;} s * {color: green;} s _ {color: grey;} s ** {color: blue;} s <b> </b> {color: black;}',
);

test('Breaks down paragraphs', (t) => {
  t.is(ast.compile('a simple one line', testStyle).paragraphs.length, 1);
  t.is(ast.compile('\na simple one line', testStyle).paragraphs.length, 1);
  t.is(ast.compile('\n\na simple one line', testStyle).paragraphs.length, 1);
  t.is(ast.compile('a simple one line\n\n', testStyle).paragraphs.length, 1);
  t.is(ast.compile('a line\nanother line', testStyle).paragraphs.length, 1);
  t.is(ast.compile('a line\n\nanother line', testStyle).paragraphs.length, 2);
  t.is(ast.compile('a line\n\n\nanother line', testStyle).paragraphs.length, 2);
});

test('Apply paragraph style', (t) => {
  t.deepEqual(ast.compile('aaa\na simple one line', testStyle).paragraphs[0].styles, ['aaa']);
  t.deepEqual(ast.compile('a simple one line\n\naaa\nanother line', testStyle).paragraphs[1].styles, ['aaa']);
});

test('Simple span rule', (t) => {
  const compiled = ast.compile('a *simple* one line', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, ['a ', { contents: ['simple'], style: '*' }, ' one line']);
});

test('Unterminated rule match', (t) => {
  const compiled = ast.compile('a *simple one line', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, ['a *simple one line']);
});

test('nested rules', (t) => {
  const compiled = ast.compile('a *sim_ple_* one line', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, [
    'a ',
    {
      contents: [
        'sim',
        {
          contents: ['ple'],
          style: '_',
        },
      ],
      style: '*',
    },
    ' one line',
  ]);
});

test('Similar rules', (t) => {
  const compiled = ast.compile('a**bb*c*bb**d', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, [
    'a',
    {
      contents: [
        'bb',
        {
          contents: ['c'],
          style: '*',
        },
        'bb',
      ],
      style: '**',
    },
    'd',
  ]);
});

test('Adjacent similar rules start', (t) => {
  const compiled = ast.compile('a***c*bb**d', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, [
    'a',
    {
      contents: [
        {
          contents: ['c'],
          style: '*',
        },
        'bb',
      ],
      style: '**',
    },
    'd',
  ]);
});

test('Explicitely closed rule', (t) => {
  const compiled = ast.compile('a<b>b</b>c', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, [
    'a',
    {
      contents: ['b'],
      style: '<b>',
    },
    'c',
  ]);
});

/*
test('Adjacent similar rules end', (t) => {
  const compiled = ast.compile('a**bb*c***d', testStyle);

  t.deepEqual(compiled.paragraphs[0].contents, [
    'a',
    {
      contents: [
        'bb',
        {
          contents: ['c'],
          style: '*',
        }
      ],
      style: '**',
    },
    'd',
  ]);
});
*/
