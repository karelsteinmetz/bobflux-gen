
export function getStatePrefixFromKeyPrefix(prefix: string, propName: string): string {
    let prefixex = prefix.split('.').reverse();
    let s = prefixex.pop();
    while (prefixex.length > 0)
        s += firstToUpper(prefixex.pop());
    s += firstToUpper(propName);
    return s;
}

export function removeIfacePrefix(propName: string, prefix: string = 'I'): string {
    return propName.slice(1);
}

export function removePostfix(propName: string, postfix: string) {
    let expectedIndex = propName.length - postfix.length;
    return propName.toLowerCase().lastIndexOf(postfix.toLowerCase()) === expectedIndex ? propName.slice(0, expectedIndex) : propName;
}

function firstToUpper(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}