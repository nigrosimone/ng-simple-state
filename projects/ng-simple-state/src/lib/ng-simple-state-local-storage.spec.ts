/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';

describe('NgSimpleStateLocalStorage', () => {

    let service: NgSimpleStateLocalStorage;

    beforeEach(() => {
        service = new NgSimpleStateLocalStorage();
    });

    afterEach(() => {
        service.clear();
    });

    it('localstorage active', () => {
        expect(service.isActive()).toBe(true);
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.getItem<string>('test')).toBe('1');
        expect(service.removeItem('test')).toBe(true);
        expect(service.getItem('test')).toBe(null);
    });

    it('localstorage not activee', () => {
        (service as any).isStorageActive = false;
        expect(service.isActive()).toBe(false);
        expect(service.setItem('test', '1')).toBe(false);
        expect(service.getItem('test')).toBe(null);
        expect(service.removeItem('test')).toBe(false);
    });
});
