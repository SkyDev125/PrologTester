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

    createTest(file, line) {
        const testId = `test:${file.fsPath}:${line}`;
        const testLabel = `Test at ${file.fsPath}:${line}`;
        const testUri = file; // Use the file Uri here
        const test = this.controller.createTestItem(testId, testLabel, testUri);
        test.range = new vscode.Range(line, 0, line, 0);
        return test;
    }

    async resolveTests(run) {
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const prologFiles = await vscode.workspace.findFiles('**/*.pl', '**/node_modules/**');
        for (const file of prologFiles) {
            const content = fs.readFileSync(file.fsPath, 'utf8');
            const lines = content.split('\n');
            let inTestBlock = false;
            for (const line of lines) {
                if (line.includes(':- begin_tests(')) {
                    inTestBlock = true;
                } else if (line.includes(':- end_tests(')) {
                    inTestBlock = false;
                } else if (inTestBlock && line.trim().startsWith('test(')) {
                    const test = this.createTest(file, line);
                    run.tests.push(test);
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
