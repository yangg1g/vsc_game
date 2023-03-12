import * as vscode from 'vscode';
import { map } from './extension';

export class MyPosition {
	x: number
	y: number
	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}
};

export enum MyState {
	NORMAL, ATTACK, SIDE, MAGATT, DEAD, DEFEN
}

export enum ObjState {
	PLAYER, ENEMY
}

export function vs_getText(l1: number, r1: number, l2: number, r2: number) {
	return vscode.window.activeTextEditor.document.getText(new vscode.Range(new vscode.Position(Math.round(l1), Math.round(r1)), new vscode.Position(Math.round(l2), Math.round(r2))))
}


export function my_getText(x, y, l) {
	if (map.length < y) {
		return ""
	}
	return map[Math.round(y)].slice(Math.round(x), Math.round(x + l))
}

export function on_ground(p: MyPosition, l: number) {
	return Math.round(p.y + 1) == map.length || my_getText(p.x, p.y + 1, l).trim() != ""
}

export function collision_y(old_p: MyPosition, ep_y, sprite_l: number) {
	let res = ""
	if (old_p.y + ep_y < 0 || Math.round(old_p.y + ep_y) >= vscode.window.activeTextEditor.document.lineCount) {
		return false
	}
	if (Math.round(old_p.y + ep_y) != Math.round(old_p.y)) {
		res = my_getText(old_p.x, old_p.y + ep_y, sprite_l)
	}
	return res.trim() == ""
}

export function collision_x(old_p: MyPosition, ep_x, sprite_l: number) {
	let res = ""
	if (old_p.x + ep_x < 1 || old_p.x + ep_x > 120) {
		return false
	}
	if (Math.round(old_p.x + ep_x) != Math.round(old_p.x)) {
		if (Math.round(old_p.x + ep_x) < Math.round(old_p.x)) {
			res = my_getText(old_p.x + ep_x, old_p.y, 1)
		}
		else {
			res = my_getText(old_p.x + ep_x + sprite_l - 1, old_p.y, 1)
		}
	}
	return res.trim() == ""
}