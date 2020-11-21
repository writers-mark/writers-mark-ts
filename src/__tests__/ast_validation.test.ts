import * as style from '../style';
import * as ast from '../ast';
import test from 'ava';

const testStyle = style.compile('p aaa {color: red;} s * {color: green;}');

test('Empty string is fine', (t) => {
  t.true(ast.isValid({ paragraphs: [] }, testStyle));
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
