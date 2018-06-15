import { join } from 'path';
import { homedir } from 'os';

import * as xdgBasedir from 'xdg-basedir';

export const EXTENSION_NAME = 'tmc-vscode';
export const DATA_DIR = join(xdgBasedir.data, EXTENSION_NAME);
export const CONFIG_DIR = join(xdgBasedir.config, EXTENSION_NAME);
export const SETTINGS_FILE = join(CONFIG_DIR, 'tmc-vscode.json');

export const TMC_LANGS_JAR_PATH = join(DATA_DIR, 'tmc-langs.jar');
export const TMC_LANGS_JAR_URL =
  'http://maven.testmycode.net/nexus/content/repositories/snapshots/fi/helsinki/cs/tmc/tmc-langs-cli/0.7.9-SNAPSHOT/tmc-langs-cli-0.7.9-20180604.080639-2.jar';

export const PROJECT_FOLDER = join(homedir(), 'TMCVscodeProjects')
