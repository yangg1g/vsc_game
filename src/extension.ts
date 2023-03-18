/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { randomInt } from 'crypto';
import * as vscode from 'vscode';
import { MyPosition, MyState, ObjState, on_ground, collision_x, collision_y, vs_getText } from './utils';
import { BaseObject, Item, Palyer, CharObject, IntObject, FloatObject, ForObject } from './object';

export var map = new Array<string>()
export var render_list = new Array()
export var object_list = new Array<BaseObject>()
export var enemy_list = new Array<BaseObject>()
export var my_player: Palyer = new Palyer(0, 0)

class StatusBar {
	private _actual: vscode.StatusBarItem;
	private _lastText: string;

	constructor() {
		this._actual = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		this._actual.show();
	}

	public setText(text: string): void {
		if (this._lastText === text) {
			return;
		}
		this._lastText = text;
		this._actual.text = this._lastText;
	}
}

var statusBar = new StatusBar();
statusBar.setText("Good Luck!")

function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function type(args): void {
	my_player.KeyMove(args.text)
}

async function render() {
	render_list = new Array()
	my_player.Active()
	object_list.forEach((v, i) => {
		if (v.state == MyState.DEAD) {
			object_list.splice(i, 1)
		}
		else {
			v.Move()
			v.Active()
		}
	})
	enemy_list.forEach((v, i) => {
		if (v.state == MyState.DEAD) {
			enemy_list.splice(i, 1)
		}
		else {
			v.Move()
			v.Active()
		}
	})
	while (render_list.length > 0) {
		let render_flag = true
		render_list = render_list.sort((a, b) => {
			if (a[1] != b[1]) {
				return a[1] - b[1]
			}
			else if (a[0] - b[0]) {
				return a[0] - b[0]
			}
			else {
				return a[2].length - b[2].length
			}
		})
		// console.log(render_list)
		let i = 0
		while (i < render_list.length - 1) {
			let a = render_list[i]
			let b = render_list[i + 1]
			if (a[1] == b[1] && a[0] + a[2].length > b[0]) {
				render_flag = false
				if (a[3] < b[3]) {
					b[2] = b[2].slice(a[0] + a[2].length - b[0])
					b[0] = a[0] + a[2].length
					// i++
					if (b[2] == '') {
						render_list.splice(i + 1, 1)
					}
					else {
						i++
					}
				}
				else {
					a[2] = a[2].slice(0, b[0] - a[0])
					// i++
					if (a[2] == '') {
						render_list.splice(i, 1)
					}
					else {
						i++
					}
				}
				break
			}
			else {
				i++
			}
		}
		if (render_flag) {
			break
		}
	}
	// console.log(render_list)
	await vscode.window.activeTextEditor.edit(editBuilder => {
		render_list.forEach((v, i, a) => {
			let lineNum = vscode.window.activeTextEditor.document.lineAt(v[1]).text.length
			if (lineNum < v[0] + v[2].length) {
				editBuilder.insert(new vscode.Position(v[1], lineNum), " ".repeat(v[0] + v[2].length - lineNum))
			}
		})
	})
	await vscode.window.activeTextEditor.edit(editBuilder => {
		render_list.forEach((v, i, a) => {
			editBuilder.replace(new vscode.Range(new vscode.Position(v[1], v[0]), new vscode.Position(v[1], v[0] + v[2].length)), v[2])
		})
	})
}

function generatEnemy(enemy_str, enemy_type) {
	map.forEach((v, i) => {
		let t_id1 = v.indexOf(enemy_str + " ")
		if (t_id1 > 0) {
			map[i] = v.slice(0, t_id1) + " ".repeat(enemy_str.length) + v.slice(t_id1 + 3)
			let tmp1 = new enemy_type(t_id1, i)
			enemy_list.push(tmp1)
		}
	})
}

async function mainGame() {
	var files = await vscode.workspace.findFiles("*.cpp")
	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
	files = files.sort()
	let level_id = 0
	while (level_id < files.length) {
		let file = files[level_id]
		console.log(file)
		var doc = await vscode.workspace.openTextDocument(file)
		await vscode.window.showTextDocument(doc)
		await vscode.window.activeTextEditor.edit(editBuilder => {
			for (let i = 0; i < doc.lineCount; i++) {
				let tab1 = doc.lineAt(i).text.indexOf("\t")
				if (tab1 >= 0) {
					let tab2 = tab1 + 1
					while (doc.lineAt(i).text[tab2] == "\t") {
						tab2++
					}
					editBuilder.replace(new vscode.Range(new vscode.Position(i, tab1), new vscode.Position(i, tab2)), "    ".repeat(tab2 - tab1))
				}
			}
		})
		map.splice(0)
		enemy_list.splice(0)
		for (let i = 0; i < doc.lineCount; i++) {
			map.push(doc.lineAt(i).text)
		}
		my_player.UpdatePos(1, doc.lineCount - 1)
		my_player.Show()
		generatEnemy("char", CharObject)
		generatEnemy("int", IntObject)
		generatEnemy("float", FloatObject)
		generatEnemy("for", ForObject)
		while (true) {
			// console.log("render")
			if (my_player.state == MyState.DEAD) {
				statusBar.setText("Game Over!")
				await delay(1000)
				await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				my_player.state = MyState.NORMAL
				break
			}
			// console.log(enemy_list)
			if (enemy_list.length == 0) {
				statusBar.setText("Next Level!")
				await delay(1000)
				level_id++
				break
			}
			await render()
			await delay(20)
		}
		// this.intervalId = setInterval(render, 20);
	}
	statusBar.setText("You Win!")
}

export function activate(context: vscode.ExtensionContext) {
	// vscode.commands.getCommands().then(allCommands => {
	// 	console.log('所有命令：')
	// 	allCommands.forEach((v) => {
	// 		console.log(v)
	// 	})
	// });
	context.subscriptions.push(vscode.commands.registerCommand('type', type))
	mainGame()

	return
}

