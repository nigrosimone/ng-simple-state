import { NgSimpleStateSessionStorage } from './ng-simple-state-session-storage';

describe('NgSimpleStateSessionStorage', () => {

    let service: NgSimpleStateSessionStorage;

    beforeEach(() => {
        service = new NgSimpleStateSessionStorage();
    });

    afterEach(() => {
        service.clear();
    });

    it('sessionStorage active', () => {
        expect(service.isActive()).toBe(true);
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.getItem<string>('test')).toBe('1');
        expect(service.removeItem('test')).toBe(true);
        expect(service.getItem('test')).toBe(null);
    });

    it('sessionStorage not activee', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).isStorageActive = false;
        expect(service.isActive()).toBe(false);
        expect(service.setItem('test', '1')).toBe(false);
        expect(service.getItem('test')).toBe(null);
        expect(service.removeItem('test')).toBe(false);
    });
});
