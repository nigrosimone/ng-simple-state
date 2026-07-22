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

  it('clear() should only remove NgSimpleState-prefixed keys and leave foreign keys intact', () => {
    // Foreign key not owned by the library
    sessionStorage.setItem('foreignKey', 'keep-me');
    // Library-owned keys (stored with the BASE_KEY prefix internally)
    expect(service.setItem('a', '1')).toBe(true);
    expect(service.setItem('b', '2')).toBe(true);

    expect(service.clear()).toBe(true);

    // Library keys are gone
    expect(service.getItem('a')).toBe(null);
    expect(service.getItem('b')).toBe(null);
    // Foreign key survives
    expect(sessionStorage.getItem('foreignKey')).toBe('keep-me');

    sessionStorage.removeItem('foreignKey');
  });
});
