'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// Cannot use util.promisify since vscode still uses Node 7
import * as promisify from 'es6-promisify';
import * as fs from 'fs';
const stat = promisify(fs.stat);
const mkdirp = promisify(require('mkdirp'));
import { createWriteStream } from 'fs';
const unlink = promisify(require('fs').unlink);
import * as http from 'http';
import fetch from 'node-fetch';
import * as simpleOauth2 from 'simple-oauth2';
import Api from './api';

import { TMC_LANGS_JAR_PATH, TMC_LANGS_JAR_URL, DATA_DIR, PROJECT_FOLDER } from './constants';
import Settings from './settings';
import { QuickPickItem } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  //console.log('Congratulations, your extension "tmc" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'extension.sayHello',
    async () => {
      const settings = new Settings();
      await settings.setup();
      const at = await settings.get('access_token');
      if (!at) {
        await login(settings);
      }
      await vscode.window.showInformationMessage(
        `Logged in as ${await settings.get('username')}.`
      );
      const api = new Api(await settings.get('access_token'));
      const orgs = await api.fetchOrganizations();
      orgs.sort((a, b) => {
        if (a.pinned && b.pinned) {
          return a.name.localeCompare(b.name);
        }
        if (a.pinned) {
          return -1;
        }
        if (b.pinned) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
      const orgs2: [QuickPickItem] = orgs.map(org => {
        return {
          label: `${org.pinned ? '🌟 ' : ''}${org.name}`,
          detail: org.information,
          description: org.slug,
        };
      });

      const chosenOption = await vscode.window.showQuickPick(orgs2, {
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: 'Please choose an organization.',
      });
      const chosenSlug = chosenOption.description;
      const chosenOrganization = orgs.find(org => org.slug == chosenSlug);
      settings.set('organization', JSON.stringify(chosenOrganization));
      const courses = await api.fetchCourses(chosenOrganization.slug);
      courses.sort((a, b) => a.title.localeCompare(b.title));
      const courses2: [QuickPickItem] = courses.map(course => {
        return {
          label: course.title,
          detail: course.description,
          description: course.name,
        };
      });
      const courseSelection = await vscode.window.showQuickPick(courses2, {
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: 'Please choose a course.',
      });
      const selectedCourseName = courseSelection.description;
      const chosenCourse = courses.find(course => course.name == selectedCourseName);
      settings.set("course", JSON.stringify(chosenCourse));
      const courseDetails =  await api.fetchCourseDetails(chosenCourse);

      const downloadSelection = await vscode.window.showQuickPick(['Yes', 'Maybe some other time'], {
        placeHolder: `There are ${courseDetails.exercises.length} exercises available. Would you like to download them?`,
        ignoreFocusOut: true,
      });
      if ( downloadSelection !== 'Yes') {
        return;
      }
      await mkdirp(PROJECT_FOLDER);
      await api.downloadExercise(courseDetails.exercises[0]);
      console.log('lolled');
    }
  );

  context.subscriptions.push(disposable);
  startupActions();
}

async function login(settings: Settings) {
  const username = await vscode.window.showInputBox({
    prompt: 'Test My Code username',
    ignoreFocusOut: true,
  });
  const password = await vscode.window.showInputBox({
    prompt: 'Test My Code password',
    password: true,
    ignoreFocusOut: true,
  });
  const oauth2 = simpleOauth2.create(settings.getOauthSettings());
  const authenticationResult = await oauth2.ownerPassword.getToken({
    username,
    password,
    scope: 'public',
  });
  const token = oauth2.accessToken.create(authenticationResult);
  const accessToken: string = authenticationResult.access_token;
  await settings.set('access_token', accessToken);
  await settings.set('username', username);
}

async function startupActions() {
  await mkdirp(DATA_DIR);
  try {
    await stat(TMC_LANGS_JAR_PATH);
    // vscode.window.showInformationMessage(`${TMC_LANGS_JAR_PATH} exists`);
  } catch (err) {
    if (err.code == 'ENOENT') {
      downloadLangsWithProgress();
    } else {
      vscode.window.showErrorMessage(
        `Error while reading the data directory: ${err}`
      );
    }
  }
}

function downloadLangsWithProgress() {
  vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: 'hello' },
    p => {
      return new Promise((resolve, reject) => {
        p.report({
          message:
            'Downloading important components for the Test My Code plugin... 0%',
        });
        downloadLangs(p, resolve);
      });
    }
  );
}

function downloadLangs(
  progressHandle: vscode.Progress<{ message?: string }>,
  onComplete
) {
  const outputFile = createWriteStream(TMC_LANGS_JAR_PATH);
  const request = http
    .get(TMC_LANGS_JAR_URL, response => {
      response.pipe(outputFile);
      const totalLength = parseInt(response.headers['content-length'], 10);
      let dowloadedLength = 0;
      response.on('data', chunk => {
        dowloadedLength += chunk.length;
        const progress = (dowloadedLength / totalLength * 100).toLocaleString(
          undefined,
          { maximumFractionDigits: 0 }
        );
        progressHandle.report({
          message: `Downloading important components for the Test My Code plugin... ${
            progress
          }%`,
        });
      });
      outputFile.on('finish', () => {
        outputFile.close();
        onComplete();
      });
    })
    .on('error', error => {
      unlink(TMC_LANGS_JAR_PATH);
      vscode.window.showErrorMessage(
        `An error occured while downloading Test My Code components: ${error}`
      );
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}
