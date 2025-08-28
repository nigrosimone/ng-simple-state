import { NgSimpleStateSessionStorage } from './ng-simple-state-session-storage';

describe('NgSimpleStateSessionStorage', () => {

    let service: NgSimpleStateSessionStorage;

    beforeEach(() => {
        service = new NgSimpleStateSessionStorage();
    });

    afterEach(() => {
        service.clear();
    });

    it('sessionStorage', () => {
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
