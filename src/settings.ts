import { ModuleOptions } from 'simple-oauth2';
import * as promisify from 'es6-promisify';
import { CONFIG_DIR, SETTINGS_FILE } from './utils/constants';
const mkdirp = promisify(require('mkdirp'));
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);

export default class Settings {
  cache: Map<string, string>;

  async setup() {
    await mkdirp(CONFIG_DIR);
    try {
      const cacheString = await readFile(SETTINGS_FILE, 'utf8');
      this.cache = new Map(Object.entries(JSON.parse(cacheString)));
    } catch (err) {
      this.cache = new Map();
    }
  }

  async set(key: string, value: string) {
    if (!this.cache) {
      await this.setup();
    }
    this.cache.set(key, value);
    await this._save();
  }

  async get(key: string): Promise<string> {
    if (!this.cache) {
      await this.setup();
    }
    return this.cache.get(key);
  }

  async _save() {
    const obj = {};
    for (let [k, v] of this.cache) {
       obj[k] = v;
    }
    await writeFile(SETTINGS_FILE, JSON.stringify(obj));
  }

  getOauthSettings(): ModuleOptions {
    return {
      client: {
        id: '72065a25dc4d3e9decdf8f49174a3e393756478d198833c64f6e5584946394f0',
        secret:
          '3e6c4df1992e4031d316ea1933e350e9658326a67efb2e65a5b15207bdc09ee8',
      },
      auth: {
        tokenHost: 'https://tmc.mooc.fi/',
      },
    };
  }
}
