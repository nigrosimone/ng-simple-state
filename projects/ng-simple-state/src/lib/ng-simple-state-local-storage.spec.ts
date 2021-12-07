import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';

describe('NgSimpleStateLocalStorage', () => {

    afterEach(() => {
        localStorage.clear();
    });

    it('localstorage active', () => {
        const service = new NgSimpleStateLocalStorage();
        expect(service.isActive()).toBe(true);
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.getItem<string>('test')).toBe('1');
        expect(service.removeItem('test')).toBe(true);
        expect(service.getItem('test')).toBe(null);
    });

    it('localstorage not activee', () => {
        const service = new NgSimpleStateLocalStorage();
        (service as any).isStorageActive = false;
        expect(service.isActive()).toBe(false);
        expect(service.setItem('test', '1')).toBe(false);
        expect(service.getItem('test')).toBe(null);
        expect(service.removeItem('test')).toBe(false);
    });
});
