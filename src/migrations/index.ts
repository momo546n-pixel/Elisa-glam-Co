import * as migration_20261022_202841_initial from './20261022_202841_initial';

export const migrations = [
  {
    up: migration_20261022_202841_initial.up,
    down: migration_20261022_202841_initial.down,
    name: '20261022_202841_initial'
  },
];
