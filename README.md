# Writer's Mark

[![npm](https://badgen.net/npm/v/writers-mark)](https://www.npmjs.com/package/writers-mark)
[![install size](https://packagephobia.com/badge?p=writers-mark)](https://packagephobia.com/result?p=writers-mark)
[![github actions](https://github.com/writers-mark/writers-mark-ts/workflows/Tests/badge.svg)](https://github.com/FrancoisChabot/writers-mark/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/writers-mark/writers-mark-ts/badge.svg?targetFile=package.json)](https://snyk.io/test/github/FrancoisChabot/writers-mark?targetFile=package.json)

Easy, safe and flexible markup for user-generated content.

The main objective is to thread the needle between the simplicity of markdown and the power of HTML/CSS, while providing security guarantees so that user-generated content can be both safe and flexible at the same time. 

## Getting started for writing:

### Absolute basics

Text is broken down in a series of paragraphs, each of which are separated by a blank line.

Text:

```
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae quam in est
pulvinar pharetra. Integer posuere dolor ex, efficitur tincidunt metus blandit eu. 
Praesent nunc sem, gravida quis urna nec, gravida venenatis quam.

Duis lacinia eros in lectus maximus, vel tincidunt nunc convallis. Sed enim odio, 
viverra quis suscipit sed, dapibus in leo. Nullam egestas velit eu augue aliquet 
faucibus. Aliquam gravida commodo semper. Vestibulum ante ipsum primis in faucibus 
```

### Styling paragraphs

A style is applied to a paragraph by putting the name of the style by itself 
on the first line of a paragraph. Styles meant to be applied to paragraphs 
are denoted by the letter p in a styling section.

Finally, you can define a `default` rule that will apply to all paragraphs that are not tagged with other rules

Style:
```
p # {
  font-size: 1.5em;
}

p __aside__ {
  margin-left: 3em;
}

p default {
  font-family: sans-serif;
}
```

Text:
```
# 
The title

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae quam in est
pulvinar pharetra. Integer posuere dolor ex, efficitur tincidunt metus blandit eu. 
Praesent nunc sem, gravida quis urna nec, gravida venenatis quam.

__aside__
Duis lacinia eros in lectus maximus, vel tincidunt nunc convallis. Sed enim odio, 
viverra quis suscipit sed, dapibus in leo. Nullam egestas velit eu augue aliquet 
faucibus. Aliquam gravida commodo semper. Vestibulum ante ipsum primis in faucibus 
```

### Styling spans

Styles can also be applied to spans of text. Styles meant to be applied to spans of text
are denoted by the letter s in a styling section. If a span style has two names, then
the first one will be used to open the span, and the second to close it.

Style:
```
s ** {
  font-style: italic;
}

s <b> </b> {
  font-weight: bold;
}
```

Text:
```
Lorem ipsum dolor sit amet, **consectetur** adipiscing <b>elit</b>. Donec vitae quam in est
pulvinar pharetra. Integer posuere dolor ex, efficitur tincidunt metus blandit eu. 
Praesent nunc sem, gravida quis urna nec, gravida venenatis quam.
```

### What can I put in styles?

CSS properties need to be **opted-in**, so this will depend on the developer integrating the library.
However, if the library's default settings are used, the following properties can be used:

| property           | paragraphs | spans |
|--------------------|------------|-------|
| `color`            | YES        | YES   |
| `background-color` | YES        | YES   |
| `font*`            | YES        | YES   |
| `margin*`          | YES        | NO    |
| `border*`          | YES        | NO    |
| `text-align`       | YES        | NO    |


## Getting started for implementing:

### Installation

```
npm install writers-mark
```

### Usage
```
import {compileStyle, compileAst, isStyleValid, isAstValid} from 'writers-mark';

// Compiling.
const style = compileStyle(styleString);
const ast = compileAst(textString, style);

// Serializing.
const style_str = JSON.stringify(style);
const ast_str = JSON.stringify(ast);

// ...

// Deserializing.
const recovered_style = JSON.parse(style_str);
const recovered_ast = JSON.parse(ast_str);

if(isStyleValid(recovered_style) && isAstValid(recovered_style, recovered_ast)) {
  ...
}

```


Rendering the ast is not within the scope of this module, please see [writers-mark-dom](https://github.com/writers-mark/writers-mark-dom) or [writers-mark-react](https://github.com/writers-mark/writers-mark-react) for that.
