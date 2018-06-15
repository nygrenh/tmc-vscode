import { TMC_LANGS_JAR_PATH } from "./constants";
// Cannot use util.promisify since vscode still uses Node 7
import * as promisify from "es6-promisify";
import * as fs from "fs";
const stat = promisify(fs.stat);
const childProcess = require("child_process");
const exec = promisify(childProcess.exec);

export default async function() {
  // Fail if tmc-langs.jar does not exist
  await stat(TMC_LANGS_JAR_PATH);

  const tempLangs =
    "/home/henrik/Code/tmc-langs/tmc-langs-cli/target/tmc-langs-cli-0.7.9-SNAPSHOT.jar";

  async function runLangsCommand(
    command: string,
    commandArguments: { [key: string]: string }
  ): Promise<void> {
    let shellCommand = `java -jar "${tempLangs}" ${command}`;
    Object.entries(commandArguments).forEach(([name, value]) => {
      shellCommand += ` --${name} "${value}"`;
    });
    console.log(`Running command ${shellCommand}`);
    await exec(shellCommand);
  }

  return {
    async extractProject(zipPath: string, outputPath: string): Promise<void> {
      console.log(`Extracting `);
      await runLangsCommand("extract-project", {
        exercisePath: zipPath,
        outputPath
      });
    }
  };
}
