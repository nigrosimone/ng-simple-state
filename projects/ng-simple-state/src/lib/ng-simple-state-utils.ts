/**
 * Compares two values of type `K` to determine if they are equal.
 * 
 * This function performs a deep comparison for objects and arrays, and a shallow comparison for primitive values.
 * 
 * @template K - The type of the values being compared.
 * @param {K} a - The first value to compare.
 * @param {K} b - The second value to compare.
 * @returns {boolean} - Returns `true` if the values are equal, otherwise `false`.
 * 
 * @example
 * // Primitive values
 * stateComparator(1, 1); // true
 * stateComparator(1, 2); // false
 * 
 * // Objects
 * stateComparator({ a: 1 }, { a: 1 }); // true
 * stateComparator({ a: 1 }, { a: 2 }); // false
 * 
 * // Arrays
 * stateComparator([1, 2, 3], [1, 2, 3]); // true
 * stateComparator([1, 2, 3], [4, 5, 6]); // false
 * 
 * // Special cases
 * stateComparator(NaN, NaN); // true
 * stateComparator(/abc/i, /abc/i); // true
 */
export function stateComparator<K>(a: K, b: K): boolean {
    if (a === b) return true;

    if (a && b && typeof a == 'object' && typeof b == 'object') {
        if (a.constructor !== b.constructor) return false;

        let length, i, keys;
        if (Array.isArray(a) && Array.isArray(b)) {
            length = a.length;
            if (length != b.length) return false;
            for (i = length; i-- !== 0;)
                if (!stateComparator(a[i], b[i])) return false;
            return true;
        }

        if (a.constructor === RegExp && b.constructor === RegExp) return (a as RegExp).source === (b as RegExp).source && (a as RegExp).flags === (b as RegExp).flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;

        for (i = length; i-- !== 0;)
            if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

        for (i = length; i-- !== 0;) {
            const key = keys[i];
            if (!stateComparator((a as any)[key], (b as any)[key])) return false;
        }

        return true;
    }

    return a !== a && b !== b;
};