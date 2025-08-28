import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';

describe('NgSimpleStateLocalStorage', () => {

    let service: NgSimpleStateLocalStorage;

    beforeEach(() => {
        service = new NgSimpleStateLocalStorage();
    });

    afterEach(() => {
        service.clear();
    })

    it('localStorage', () => {
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.getItem('test')).toBe('1');
        expect(service.removeItem('test')).toBe(true);
        expect(service.getItem('test')).toBe(null);
        expect(service.clear()).toBe(true);
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.clear()).toBe(true);
        expect(service.getItem('test')).toBe(null);
    });
});
