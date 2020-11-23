import { Whitelist } from './index';

/** Straigforward TRIE node. */
interface Node {
  terminator: boolean;
  children: Map<string, Node>;
}

const insert = (pattern: string, target: Node) => {
  const key = pattern.substr(0, 1);
  const rest = pattern.substr(1);

  const existing = target.children.get(key);
  if (existing) {
    if (rest.length === 0) {
      existing.terminator = true;
    } else {
      insert(rest, existing);
    }
  } else {
    const terminator = rest.length === 0;
    const children = new Map<string, Node>();

    const newNode = {
      terminator,
      children,
    };

    target.children.set(key, newNode);
    if (!terminator) {
      insert(rest, newNode);
    }
  }
};

export class WhitelistFilter {
  root: Node = { terminator: false, children: new Map<string, Node>() };

  constructor(patterns: string[]) {
    for (const p of patterns) {
      insert(p, this.root);
    }
  }

  allows(key: string): boolean {
    let current = this.root;
    for (const char of key) {
      const next = current.children.get(char);
      if (!next) {
        return false;
      } else {
        current = next;
      }
    }

    return current.terminator;
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
