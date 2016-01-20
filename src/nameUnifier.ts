
export function getStatePrefixFromKeyPrefix(prefix: string, propName: string): string {
    let prefixex = prefix.split('.').reverse();
    let s = prefixex.pop();
    while (prefixex.length > 0)
        s += firstToUpper(prefixex.pop());
    s += firstToUpper(propName);
    return s;
}

function firstToUpper(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}