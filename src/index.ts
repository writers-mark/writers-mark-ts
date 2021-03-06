import * as StyleNS from './style';
import * as TextNS from './text';
import { CompiledWhitelist, compileWhitelist } from './whitelist';

const defaultCommonProps: string[] = [
  'background-color',
  'border',
  'color',
  'color',
  'font-family',
  'font-style',
  'font-weight',
  'text-decoration',
];

const defaultParaProps: string[] = ['text-align', 'margin', 'padding'];
const defaultSpanProps: string[] = [];
const defaultContProps: string[] = [];

type Style = StyleNS.Style;
type Text = TextNS.CompiledText;

/** CSS property whitelist. */
interface Whitelist {
  /** Properties allowed in para <name> {} rules */
  para: string[];

  /** Properties allowed in span <name> [close] {} rules */
  span: string[];

  /** Properties allowed in cont {} rules */
  cont: string[];
}

/** Parameters for configuring a Context */
interface Options {
  /**
   * List of allowable CSS properties
   */
  whitelist?: Whitelist;

  /**
   * Wether links [url](text) are allowed.
   */
  links?: boolean;
}

interface InternalOptions {
  links: boolean;
}

const defaultOptions = {
  whitelist: {
    para: [...defaultCommonProps, ...defaultParaProps],
    span: [...defaultCommonProps, ...defaultSpanProps],
    cont: [...defaultCommonProps, ...defaultContProps],
  },
  links: true,
};

/** Primary user-facing entry point */
class Context {
  whitelist: CompiledWhitelist;
  options: InternalOptions;
  /** Create a context
   *
   * @param options Optional configs. If none is provided, sane defautls will be used.
   */
  constructor(options?: Options) {
    if (!options) options = defaultOptions;

    this.whitelist = compileWhitelist(options.whitelist || defaultOptions.whitelist);
    this.options = {
      links: options.links !== undefined ? options.links : defaultOptions.links,
    };
  }

  /** Compiles a style
   * @param data The raw style string to compile
   * @returns The compiled style, ready to be passed to compileText().
   */
  compileStyle(data: string): Style {
    return StyleNS.compile(data, this.whitelist);
  }

  /** Performs a full compilation of a text all at once.
   * @param text The text to compile
   * @param styles Styles to be applied to the text.
   * @returns The compiled text.
   */
  compileText(text: string, styles: Style[]): Text {
    const precompiled = TextNS.precompile(text);

    const compiledEdgeMatter = TextNS.compileEdgeMatter(precompiled.edgeMatter, this.whitelist);

    styles = [...styles, compiledEdgeMatter.style];

    const styleLut = StyleNS.buildLUT(styles);
    const paragraphs = precompiled.paragraphs.map((p) => TextNS.compileParagraph(p, styleLut, this.options));

    return { paragraphs, styles };
  }

  /** Validates that a style is safely usable. Meant to be used after deserialization.
   * @param style The style to validate
   * @returns Whether or not the style is safe to use.
   */
  isStyleValid(style: Style): boolean {
    return StyleNS.isValid(style, this.whitelist);
  }

  /** Validates that a text is safely usable. Meant to be used after deserialization.
   * @param text The text to validate
   * @returns Whether or not the text is safe to use.
   */
  isTextValid(text: Text): boolean {
    return TextNS.isValid(text, this.whitelist);
  }
}

export { Options, Context, Whitelist, defaultOptions, Style, Text };
