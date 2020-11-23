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

/** The default set of allowed CSS properties */
const defaultWhitelist: Whitelist = {
  para: [...defaultCommonProps, 'text-align', 'margin', 'padding'],
  span: [...defaultCommonProps],
  cont: [...defaultCommonProps],
};

/** Parameters for configuring a Context */
interface Options {
  /**
   * List of allowable CSS properties
   */
  whitelist?: Whitelist;
}

/** Primary user-facing entry point */
class Context {
  whitelist: CompiledWhitelist;

  /** Create a context
   *
   * @param options Optional configs. If none is provided, sane defautls will be used.
   */
  constructor(options?: Options) {
    if (!options) options = {};
    if (!options.whitelist) options.whitelist = defaultWhitelist;

    this.whitelist = compileWhitelist(options.whitelist);
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
    const paragraphs = precompiled.paragraphs.map((p) => TextNS.compileParagraph(p, styleLut));

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

export { Options, Context, Whitelist, defaultWhitelist, Style, Text };
