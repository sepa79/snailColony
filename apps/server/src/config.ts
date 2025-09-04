import { readFileSync } from 'fs';
import { join } from 'path';
import type { GameParams } from '@snail/protocol';

const params: GameParams = JSON.parse(
  readFileSync(join(__dirname, '../../../plan/config/parameters.json'), 'utf-8'),
) as GameParams;

export default params;
export type { GameParams };
