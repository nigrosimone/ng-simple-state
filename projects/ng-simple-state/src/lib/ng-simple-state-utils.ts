/**
 * Compares two values of type `K` to determine if they are equal.
 * This function performs a deep comparison for objects and arrays, and a shallow comparison for primitive values.
 */
export function ngstStateComparator<K>(a: K, b: K): boolean {
    if (a === b) {
        return true;
    }

    if (a && b && typeof a == 'object' && typeof b == 'object') {
        if (a.constructor !== b.constructor) {
            return false;
        }

        let length: number;
        let i: number;
        if (Array.isArray(a) && Array.isArray(b)) {
            length = a.length;
            if (length !== b.length) {
                return false;
            }
            for (i = length; i-- !== 0;) {
                if (!ngstStateComparator(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }

        if (a.constructor === RegExp && b.constructor === RegExp) {
            return (a as RegExp).source === (b as RegExp).source && (a as RegExp).flags === (b as RegExp).flags;
        }
        if (a.valueOf !== Object.prototype.valueOf) {
            return a.valueOf() === b.valueOf();
        }
        if (a.toString !== Object.prototype.toString) {
            return a.toString() === b.toString();
        }

        const keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) {
            return false;
        }

        for (i = length; i-- !== 0;) {
            if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
                return false;
            }
        }

        for (i = length; i-- !== 0;) {
            const key = keys[i];
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            if (!ngstStateComparator((a as any)[key], (b as any)[key])) {
                return false;
            }
        }

        return true;
    }

    return a !== a && b !== b;
};
