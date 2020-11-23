# Writer's Mark

[![npm](https://badgen.net/npm/v/writers-mark)](https://www.npmjs.com/package/writers-mark)
[![install size](https://packagephobia.com/badge?p=writers-mark)](https://packagephobia.com/result?p=writers-mark)
[![github actions](https://github.com/writers-mark/writers-mark-ts/workflows/Tests/badge.svg)](https://github.com/writers-mark/writers-mark-ts/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/writers-mark/writers-mark-ts/badge.svg?targetFile=package.json)](https://snyk.io/test/github/writers-mark/writers-mark-ts?targetFile=package.json)
[![codecov.io](https://codecov.io/github/writers-mark/writers-mark-ts/coverage.svg?branch=master)](https://codecov.io/github/writers-mark/writers-mark-ts?branch=master)

Core functionalities for [Writer's Mark](https://github.com/writers-mark/writers-mark).

## Getting started

### Installation

```
npm install writers-mark
```

### Usage
```
import {Context} from 'writers-mark';

const ctx = new Context();

// Compile a style.
const style = ctx.compileStyle(styleString);

// Compile a text.
const text = ctx.compileText(contextString, [style]);

// Style and texts are dumb data objects, so they can be serialized.
const styleStr = JSON.stringify(style);
const textStr = JSON.stringify(text);

// ... and deserialized

const recoveredStyle = JSON.parse(styleStr);
const recoveredText = JSON.parse(textStr);

// Deserialized content can be validated.
if(context.isStyleValid(recoveredStyle) && context.isTextValid(recoveredText)) {
  // Do something with it
}
```

Rendering the ast is not within the scope of this module, please see [writers-mark-dom](https://github.com/writers-mark/writers-mark-dom) or [writers-mark-react](https://github.com/writers-mark/writers-mark-react) for that.

### CSS Whitelist

While the library has sane defaults for allowed css properties, you are free to override the whitelist.
Stars denote postfix wildcards.

```
const ctx = new Context({
  para: ['text-align', 'margin*'],
  span: ['font-weight'],
  cont: [],
});
```

### Safety

The library's default CSS properties preclude anything that could lead to javascript and/or downloading resources. On top of that, values or keys including semicolons, the sequence `url(`, or any escape sequence are ignored.

However, This specific library does **NOT** perform any html escaping by itself. This is delegated to the rendering process.
