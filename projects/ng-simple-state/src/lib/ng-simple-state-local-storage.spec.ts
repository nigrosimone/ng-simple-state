import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';

describe('NgSimpleStateLocalStorage', () => {

    afterEach(() => {
        localStorage.clear();
    })

    it('isEnabled true', () => {
        const service = new NgSimpleStateLocalStorage({ enableLocalStorage: true });
        expect(service.isEnabled()).toBe(true);
        expect(service.setItem('test', '1')).toBe(true);
        expect(service.getItem('test')).toBe('1');
    });

    it('isEnabled false', () => {
        const service = new NgSimpleStateLocalStorage({ enableLocalStorage: false });
        expect(service.isEnabled()).toBe(false);
        expect(service.setItem('test', '1')).toBe(false);
        expect(service.getItem('test')).toBe(null);
    });
});
