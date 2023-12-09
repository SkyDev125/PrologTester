// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

class PrologTestController {
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
     * Resolves the tests by searching for Prolog files in the workspace and creating test items for each test case.
     * 
     * @param {vscode.TestRun} run - The TestRun object to enqueue the test items.
     * @returns {Promise<void>} - A promise that resolves when all the tests have been resolved.
     */
    async resolveTests(run) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        for (const workspaceFolder of workspaceFolders) {
            const prologFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.pl'), '**/node_modules/**');
            for (const file of prologFiles) {
                const content = await fs.promises.readFile(file.fsPath, 'utf8');
                const lines = content.split('\n');
                let inTestBlock = false;
                let currentSuite = null;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes(':- begin_tests(')) {
                        inTestBlock = true;
                        const suiteName = line.match(/\(([^)]+)\)/)[1];
                        const suiteId = `suite:${file.fsPath}:${suiteName}`;
                        currentSuite = this.controller.createTestItem(suiteId, suiteName, file);
                        currentSuite.canResolveChildren = true;
                        this.controller.items.add(currentSuite);
                    } else if (line.includes(':- end_tests(')) {
                        inTestBlock = false;
                        currentSuite = null;
                    } else if (inTestBlock && line.trim().startsWith('test(')) {
                        const testName = line.match(/\(([^)]+)\)/)[1];
                        const test = this.createTest(file, testName, i);
                        currentSuite.children.add(test);
                    }
                }
            }
        }
    }

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
