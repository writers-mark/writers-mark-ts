/** Straigforward TRIE node. */
interface Node {
  wildcard: boolean;
  terminator: boolean;
  children: Map<string, Node>;
}

const insert = (pattern: string, target: Node) => {
  const key = pattern.substr(0, 1);
  const rest = pattern.substr(1);

  const existing = target.children.get(key);
  if (existing) {
    if (rest === '*') {
      existing.wildcard = true;
    }
    if (rest.length === 0) {
      existing.terminator = true;
    } else {
      insert(rest, existing);
    }
  } else {
    const wildcard = rest === '*';
    const terminator = rest.length === 0;
    const children = new Map<string, Node>();

    const newNode = {
      wildcard,
      terminator,
      children,
    };

    target.children.set(key, newNode);
    if (!wildcard && !terminator) {
      insert(rest, newNode);
    }
  }
};

export class Whitelist {
  root: Node = { wildcard: false, terminator: false, children: new Map<string, Node>() };

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
        if (next.wildcard) {
          return true;
        }
      }
    }

    return current.terminator;
  }
}
