import { NgSimpleStateLocalStorage } from './ng-simple-state-local-storage';

describe('NgSimpleStateLocalStorage', () => {
  let service: NgSimpleStateLocalStorage;

  beforeEach(() => {
    service = new NgSimpleStateLocalStorage();
  });

  afterEach(() => {
    service.clear();
  });

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

  it('clear() should only remove NgSimpleState-prefixed keys and leave foreign keys intact', () => {
    // Foreign key not owned by the library
    localStorage.setItem('foreignKey', 'keep-me');
    // Library-owned keys (stored with the BASE_KEY prefix internally)
    expect(service.setItem('a', '1')).toBe(true);
    expect(service.setItem('b', '2')).toBe(true);

    expect(service.clear()).toBe(true);

    // Library keys are gone
    expect(service.getItem('a')).toBe(null);
    expect(service.getItem('b')).toBe(null);
    // Foreign key survives
    expect(localStorage.getItem('foreignKey')).toBe('keep-me');

    localStorage.removeItem('foreignKey');
  });
});
