/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { randomInt } from 'crypto';
import * as vscode from 'vscode';
import { MyPosition, MyState, ObjState, on_ground, collision_x, collision_y, vs_getText } from './utils';
import { BaseObject, Item, Palyer, IntObject, FloatObject, ForObject } from './object';

export var map = new Array<string>()
export var render_list = new Array()
export var object_list = new Array<BaseObject>()
export var enemy_list = new Array<BaseObject>()
export var my_player: Palyer = new Palyer(2, 9)


function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function type(args): void {
	my_player.KeyMove(args.text)
}

export function activate(context: vscode.ExtensionContext) {
	// vscode.commands.getCommands().then(allCommands => {
	// 	console.log('所有命令：')
	// 	allCommands.forEach((v) => {
	// 		console.log(v)
	// 	})
	// });


	// context.subscriptions.push(vscode.commands.registerCommand("a", () => {
	// 	console.log("a")
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand("d", () => {
	// 	console.log("d")
	// }));

	context.subscriptions.push(vscode.commands.registerCommand('type', type));

	for (let i = 0; i < vscode.window.activeTextEditor.document.lineCount; i++) {
		map.push(vscode.window.activeTextEditor.document.lineAt(i).text)
	}

	// map.forEach((v, i) => {
	// 	let str = "int"
	// 	let t_id1 = v.indexOf(str)
	// 	if (t_id1 > 0) {
	// 		v = v.slice(0, t_id1) + " ".repeat(str.length) + v.slice(t_id1 + 3)
	// 		let tmp1: IntObject = new IntObject(t_id1, i)
	// 		enemy_list.push(tmp1)
	// 	}
	// })

	// let t_id2 = vscode.window.activeTextEditor.document.lineAt(9).text.indexOf("float")
	// map[9] = map[9].slice(0, t_id2) + " ".repeat("float".length) + map[9].slice(t_id2 + "float".length)
	// let tmp2: FloatObject = new FloatObject(t_id2, 9)
	// enemy_list.push(tmp2)


	// let t_id3 = vscode.window.activeTextEditor.document.lineAt(9).text.indexOf("for")
	// map[9] = map[9].slice(0, t_id3) + " ".repeat("for".length) + map[9].slice(t_id3 + "for".length)
	// let tmp3: ForObject = new ForObject(t_id3, 9)
	// enemy_list.push(tmp3)

	my_player.Show()
	let loop_flag = true
	this.intervalId = setInterval(() => {
		if (loop_flag) {
			loop_flag = false
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
					object_list.splice(i, 1)
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
			vscode.window.activeTextEditor.edit(editBuilder => {
				render_list.forEach((v, i, a) => {
					let lineNum = vscode.window.activeTextEditor.document.lineAt(v[1]).text.length
					if (lineNum < v[0] + v[2].length) {
						editBuilder.insert(new vscode.Position(v[1], lineNum), " ".repeat(v[0] + v[2].length - lineNum))
					}
				})
			}).then(() => {
				vscode.window.activeTextEditor.edit(editBuilder => {
					render_list.forEach((v, i, a) => {
						editBuilder.replace(new vscode.Range(new vscode.Position(v[1], v[0]), new vscode.Position(v[1], v[0] + v[2].length)), v[2])
					})
				}).then(() => {
					loop_flag = true
				})
			})
		}
	}, 20);
}

