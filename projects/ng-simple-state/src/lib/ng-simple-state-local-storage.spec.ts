import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';

describe('NgSimpleStateLocalStorage', () => {

    afterEach(() => {
        localStorage.clear();
    })

    it('localstorage active', () => {
        const service = new NgSimpleStateLocalStorage();
        expect(service.isActive()).toBe(true);
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.getItem('test')).toBe('1');
    });

    it('localstorage not activee', () => {
        const service = new NgSimpleStateLocalStorage();
        service['_isActive'] = false;
        expect(service.isActive()).toBe(false);
        expect(service.setItem('test', '1')).toBe(false);
        expect(service.getItem('test')).toBe(null);
    });
});
