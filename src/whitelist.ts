import { Whitelist } from './index';
import { Trie } from './trie';

export class WhitelistFilter {
  root: Trie;

  constructor(patterns: string[]) {
    this.root = new Trie(patterns);
  }

  allows(key: string): boolean {
    return this.root.has(key);
  }
}

export interface CompiledWhitelist {
  para: WhitelistFilter;
  span: WhitelistFilter;
  cont: WhitelistFilter;
}

export const compileWhitelist = (raw: Whitelist): CompiledWhitelist => {
  return {
    para: new WhitelistFilter(raw.para),
    span: new WhitelistFilter(raw.span),
    cont: new WhitelistFilter(raw.cont),
  };
};
