// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

class PrologTestController {
    /**
     * Represents a constructor for the Prolog Test Controller.
     */
    constructor() {
        this.controller = vscode.tests.createTestController('prologTestController', 'Prolog Test Controller');
        this.controller.resolveHandler = this.resolveTests.bind(this);
        this.controller.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, async (request, token) => {
            // TODO: Implement test execution here
        }, true);
    }

    /**
     * Creates a test item for a given file, test name, and line number.
     * 
     * @param {vscode.Uri} file - The file Uri.
     * @param {string} testName - The name of the test.
     * @param {number} line - The line number of the test.
     * @returns {vscode.TestItem} The created test item.
     */
    createTest(file, testName, line) {
        const testId = `test:${file.fsPath}:${testName}`;
        const testLabel = `Test at ${file.fsPath}:${line}`;
        const testUri = file; // Use the file Uri here
        const test = this.controller.createTestItem(testId, testLabel, testUri);
        test.range = new vscode.Range(line, 0, line, 0);
        return test;
    }

    /**
     * Resolves tests by iterating through all workspace folders and calling resolveTestsInWorkspaceFolder for each folder.
     * @param {Function} run - The function to run the resolved tests.
     * @returns {Promise<void>} - A promise that resolves when all tests have been resolved.
     */
    async resolveTests(run) {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            for (const workspaceFolder of workspaceFolders) {
                await this.resolveTestsInWorkspaceFolder(workspaceFolder);
            }
        } catch (err) {
            console.error(`Failed to resolve tests: ${err}`);
        }
    }

    /**
     * Resolves tests in the specified workspace folder.
     * 
     * @param {vscode.WorkspaceFolder} workspaceFolder - The workspace folder to resolve tests in.
     * @returns {Promise<void>} - A promise that resolves when all tests in the workspace folder have been resolved.
     */
    async resolveTestsInWorkspaceFolder(workspaceFolder) {
        const prologFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.pl'), '**/node_modules/**');
        for (const file of prologFiles) {
            await this.resolveTestsInFile(file);
        }
    }

    /**
     * Resolves tests in a file.
     * 
     * @param {Object} file - The file object.
     * @returns {Promise<void>}
     */
    async resolveTestsInFile(file) {
        let content;
        try {
            content = await fs.promises.readFile(file.fsPath, 'utf8');
        } catch (err) {
            console.error(`Failed to read file ${file.fsPath}: ${err}`);
            return;
        }
        const lines = content.split('\n');
        let inTestBlock = false;
        let currentSuite = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(':- begin_tests(')) {
                currentSuite = this.beginTestSuite(line, file, i);
                inTestBlock = true;
            } else if (line.includes(':- end_tests(')) {
                inTestBlock = false;
                currentSuite = null;
            } else if (inTestBlock && line.trim().startsWith('test(')) {
                this.addTestCase(line, file, i, currentSuite);
            }
        }
    }

    /**
     * Creates and returns a test suite based on the provided line, file, and lineNumber.
     * @param {string} line - The line containing the test suite information.
     * @param {object} file - The file object representing the file containing the test suite.
     * @param {number} lineNumber - The line number where the test suite is defined.
     * @returns {object|null} - The created test suite object or null if the suite name extraction fails.
     */
    beginTestSuite(line, file, lineNumber) {
        const match = line.match(/\(([^)]+)\)/);
        if (!match) {
            console.error(`Failed to extract suite name from line ${lineNumber} in file ${file.fsPath}`);
            return null;
        }
        const suiteName = match[1];
        const suiteId = `suite:${file.fsPath}:${suiteName}`;
        const suite = this.controller.createTestItem(suiteId, suiteName, file);
        suite.canResolveChildren = true;
        this.controller.items.add(suite);
        return suite;
    }

    /**
     * Adds a test case to the test suite.
     * @param {string} line - The line containing the test case.
     * @param {object} file - The file object.
     * @param {number} lineNumber - The line number of the test case.
     * @param {object} suite - The test suite object.
     */
    addTestCase(line, file, lineNumber, suite) {
        const match = line.match(/\(([^)]+)\)/);
        if (!match) {
            console.error(`Failed to extract test name from line ${lineNumber} in file ${file.fsPath}`);
            return;
        }
        const testName = match[1];
        const test = this.createTest(file, testName, lineNumber);
        suite.children.add(test);
    }

    /**
     * Disposes the controller.
     */
    dispose() {
        this.controller.dispose();
    }
}


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "prologtester" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('prologtester.helloWorld', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from PrologTester!');
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}
