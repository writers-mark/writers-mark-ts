import * as style from '../style';
import * as ast from '../ast';
import test from 'ava';

const testStyle = style.compile('p aaa {color: red;} s * {color: green;}');

test('Empty string is fine', (t) => {
  t.true(ast.isValid({ paragraphs: [] }, testStyle));
});

test('extract no edge matter from nothing', (t) => {
  const blankFile = ast.extractEdgeMatter([]);
  t.is(blankFile.length, 0);
});

test('extract no edge matter from single line', (t) => {
  const blankFile = ast.extractEdgeMatter(['hello']);
  t.is(blankFile.length, 0);
});

test('extract no edge matter from text', (t) => {
  const blankFile = ast.extractEdgeMatter(['hello', 'world']);
  t.is(blankFile.length, 0);
});

test('unterminated front matter', (t) => {
  const blankFile = ast.extractEdgeMatter(['---', 'world']);
  t.is(blankFile.length, 0);
});

test('unterminated end matter', (t) => {
  const blankFile = ast.extractEdgeMatter(['hello', '---']);
  t.is(blankFile.length, 0);
});

test('extract front matter', (t) => {
  const data = ['---', 'aaa', '---', 'bbb'];
  const front_matter = ast.extractEdgeMatter(data);
  t.is(front_matter.length, 1);
  t.is(front_matter[0], 'aaa');

  t.is(data.length, 1);
  t.is(data[0], 'bbb');
});

test('extract front matter after blank', (t) => {
  const data = ['   ', '---', 'aaa', '---'];
  const front_matter = ast.extractEdgeMatter(data);
  t.is(front_matter.length, 1);
  t.is(front_matter[0], 'aaa');
});

test('extract back matter', (t) => {
  const data = ['bbb', '---', 'aaa', '---'];
  const front_matter = ast.extractEdgeMatter(data);
  t.is(front_matter.length, 1);
  t.is(front_matter[0], 'aaa');

  t.is(data.length, 1);
  t.is(data[0], 'bbb');
});

test('extract two matters', (t) => {
  const data = ['---', 'aaa', '---', 'bbb', '---', 'ccc', '---'];
  const front_matter = ast.extractEdgeMatter(data);
  t.deepEqual(front_matter, ['aaa', 'ccc']);

  t.is(data.length, 1);
  t.is(data[0], 'bbb');
});

test('almost extract two matters', (t) => {
  const data = ['---', 'aaa', '---', 'bbb', '---', 'ccc', '---', 'ddd'];
  const front_matter = ast.extractEdgeMatter(data);
  t.deepEqual(front_matter, ['aaa']);

  t.is(data.length, 5);
  t.is(data[0], 'bbb');
});

test('No format used is fine', (t) => {
  t.true(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: ['this is some text'],
          },
        ],
      },
      testStyle,
    ),
  );
});

test('Paragraph style', (t) => {
  t.true(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: ['this is some text'],
            styles: ['aaa'],
          },
        ],
      },
      testStyle,
    ),
  );

  t.false(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: ['this is some text'],
            styles: ['bbb'],
          },
        ],
      },
      testStyle,
    ),
  );
});

test('span style', (t) => {
  t.true(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: [
              {
                contents: ['hi there'],
                style: '*',
              },
            ],
          },
        ],
      },
      testStyle,
    ),
  );

  t.false(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: [
              {
                contents: ['hi there'],
                style: '**',
              },
            ],
          },
        ],
      },
      testStyle,
    ),
  );
});

test('nested span style', (t) => {
  t.true(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: [
              {
                contents: [
                  {
                    contents: ['yo'],
                    style: '*',
                  },
                ],
                style: '*',
              },
            ],
          },
        ],
      },
      testStyle,
    ),
  );

  t.false(
    ast.isValid(
      {
        paragraphs: [
          {
            contents: [
              {
                contents: [
                  {
                    contents: ['yo'],
                    style: '&',
                  },
                ],
                style: '*',
              },
            ],
          },
        ],
      },
      testStyle,
    ),
  );
});
