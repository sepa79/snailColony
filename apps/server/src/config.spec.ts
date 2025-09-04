import params from './config';

describe('config loader', () => {
  it('loads parameters from json', () => {
    expect(params.terrain.grass.base_speed).toBeCloseTo(1.0);
  });
});
