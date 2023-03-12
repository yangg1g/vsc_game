import { MyPosition, MyState, ObjState, on_ground, collision_x, collision_y, vs_getText } from './utils';
import { render_list, object_list, enemy_list, my_player, map } from './extension';
import { randomInt } from 'crypto';

export class BaseObject {
	speed: MyPosition = new MyPosition(0, 0)
	nowPosition: MyPosition
	oldPosition: MyPosition
	sprite: string
	last_sprite: string
	show_sprite: string = ''
	state: MyState = MyState.NORMAL
	direction: number = 1
	tier: Number
	constructor(p_x, p_y, sprite, tier) {
		this.direction = 1
		this.nowPosition = new MyPosition(p_x, p_y)
		this.sprite = sprite
		this.last_sprite = sprite
		this.tier = tier
	}
	Show() {
		render_list.push([Math.round(this.nowPosition.x), Math.round(this.nowPosition.y), this.sprite, this.tier])
	}
	Active() {
		if (this.state == MyState.DEAD) {
			return
		}
		this.show_sprite = this.sprite

		this.GravityProc()

		this.oldPosition = new MyPosition(this.nowPosition.x, this.nowPosition.y)
		let ep_p = new MyPosition(0.1 * this.speed.x, 0.1 * this.speed.y)
		this.CollisionProc(ep_p)

		// console.log("get flag")
		if (this.DefautStatePorc()) {
			render_list.push([Math.round(this.oldPosition.x), Math.round(this.oldPosition.y), " ".repeat(this.last_sprite.length), 9])
			render_list.push([Math.round(this.nowPosition.x), Math.round(this.nowPosition.y), this.show_sprite, this.tier])
			this.last_sprite = this.show_sprite
		}
	}
	Move() { }
	InAttack(direction: number) {
		if (this.state != MyState.SIDE && !(this.state == MyState.DEFEN && direction != this.direction)) {
			this.Dead()
		}
	}
	Dead() {
		this.state = MyState.DEAD
		render_list.push([Math.round(this.nowPosition.x), Math.round(this.nowPosition.y), " ".repeat(this.last_sprite.length), this.tier])
	}
	GravityProc() {
		this.speed.y += 2
		if (Math.abs(this.speed.x) > 0.01 && on_ground(this.nowPosition, this.sprite.length) && this.state != MyState.SIDE) {
			if (this.speed.x > 0) {
				this.speed.x -= 0.5
			}
			else {
				this.speed.x += 0.5
			}
		}
	}
	CollisionProc(ep_p: MyPosition) {
		if (collision_y(this.nowPosition, ep_p.y, this.sprite.length)) {
			this.nowPosition.y = this.nowPosition.y + ep_p.y
		}
		else {
			this.speed.y = 0
		}
		if (collision_x(this.nowPosition, ep_p.x, this.sprite.length)) {
			this.nowPosition.x = this.nowPosition.x + ep_p.x
		}
		else {
			this.speed.x = 0
		}
	}
	StateProc(): boolean {
		let state_change = false
		return state_change
	}
	DefautStatePorc(): boolean {
		let state_change = false
		if (Math.round(this.nowPosition.x) != Math.round(this.oldPosition.x) || Math.round(this.nowPosition.y) != Math.round(this.oldPosition.y)) {
			state_change = true
		}
		if (vs_getText(this.oldPosition.y, this.oldPosition.x, this.oldPosition.y, this.oldPosition.x + this.last_sprite.length) != this.last_sprite && !state_change) {
			state_change = true
			this.show_sprite = this.last_sprite
		}
		return this.StateProc() || state_change
	}
}

function ObjectXDist(a: BaseObject, b: BaseObject) {
	return
}

function ObjectYDist(a: BaseObject, b: BaseObject) {
	return Math.round(Math.abs(a.nowPosition.y - b.nowPosition.y))
}

function NormalAttackJudge(a: BaseObject, b: BaseObject, range: number) {
	if (a.direction == 1) {
		return Math.round(b.nowPosition.y - a.nowPosition.y) == 0 && b.nowPosition.x > a.nowPosition.x + a.show_sprite.length / 2 && b.nowPosition.x < a.nowPosition.x + a.show_sprite.length + range
	}
	else if (a.direction == -1) {
		return Math.round(b.nowPosition.y - a.nowPosition.y) == 0 && b.nowPosition.x + b.show_sprite.length < a.nowPosition.x + a.show_sprite.length / 2 && b.nowPosition.x + b.show_sprite.length > a.nowPosition.x - range
	}
}
export class Item extends BaseObject {
	src: ObjState
	constructor(p_x, p_y, v_x, v_y, sprite, src) {
		super(p_x, p_y, sprite, 1)
		this.speed = new MyPosition(v_x, v_y)
		if (v_x > 0) {
			this.direction = 1
		}
		else if (v_x < 0) {
			this.direction = -1
		}
		this.nowPosition = new MyPosition(p_x, p_y)
		this.sprite = sprite
		this.src = src
	}
	GravityProc() { }
	CollisionProc(ep_p: MyPosition) {
		if (collision_y(this.nowPosition, ep_p.y, this.sprite.length)) {
			this.nowPosition.y = this.nowPosition.y + ep_p.y
		}
		else {
			render_list.push([Math.round(this.oldPosition.x), Math.round(this.oldPosition.y), " ".repeat(this.sprite.length), 1])
			this.Dead()
			return
		}
		if (collision_x(this.nowPosition, ep_p.x, this.sprite.length)) {
			this.nowPosition.x = this.nowPosition.x + ep_p.x
		}
		else {
			render_list.push([Math.round(this.oldPosition.x), Math.round(this.oldPosition.y), " ".repeat(this.sprite.length), 1])
			this.Dead()
			return
		}
	}
	StateProc(): boolean {
		let state_change = false
		if (this.src == ObjState.PLAYER) {
			enemy_list.forEach((v, i) => {
				if (NormalAttackJudge(this, v, 1)) {
					enemy_list[i].InAttack(this.direction)
					this.Dead()
					this.show_sprite = ''
					state_change = true
				}
			})
		}
		else if (this.src == ObjState.ENEMY) {
			if (NormalAttackJudge(this, my_player, 1)) {
				my_player.InAttack(this.direction)
				this.Dead()
				this.show_sprite = ''
				state_change = true
			}
		}
		return state_change
	}
}
export class Palyer extends BaseObject {
	attack_frame = 0
	magatt_frame = 0
	side_frame = 0
	constructor(p_x, p_y) {
		super(p_x, p_y, "₍ᐢ..ᐢ₎", 0);
	}
	StateProc(): boolean {
		let state_change = false
		if (this.state == MyState.ATTACK) {
			if (this.attack_frame == 0) {
				state_change = true
				if (this.direction == 1) {
					this.show_sprite = this.sprite.replace("₎", "↗")
				}
				else {
					this.show_sprite = this.sprite.replace("₍", "↖")
				}
			}
			else if (this.attack_frame == 10) {
				state_change = true
				if (this.direction == 1) {
					this.show_sprite = this.sprite.replace("₎", "↘")
				}
				else {
					this.show_sprite = this.sprite.replace("₍", "↙")
				}
				enemy_list.forEach((v, i) => {
					if (NormalAttackJudge(this, v, 3)) {
						v.InAttack(this.direction)
					}
				})
			}
			else if (this.attack_frame == 20) {
				this.state = MyState.NORMAL
				this.attack_frame = -1
				state_change = true
			}
			this.attack_frame++
		}
		else if (this.state == MyState.SIDE) {
			if (this.side_frame == 0) {
				this.speed.x = 10 * this.direction
				this.side_frame = 1
			}
			if (this.side_frame == 2) {
				this.state = MyState.NORMAL
			}
		}
		else if (this.state == MyState.MAGATT) {
			if (this.magatt_frame == 0) {
				this.magatt_frame = 1
				let offset = this.last_sprite.length
				if (this.direction == -1) {
					offset = -1
				}
				let tmp = new Item(this.nowPosition.x + offset, this.nowPosition.y, 3 * this.direction, 0, "✩", ObjState.PLAYER)
				object_list.push(tmp)
				state_change = true
				this.state = MyState.NORMAL
			}
		}
		else if (this.state == MyState.DEFEN) {
			this.show_sprite = "₍ᐢ..ᐢ|"
			if (this.direction == -1) {
				this.show_sprite = "|ᐢ..ᐢ₎"
			}
			state_change = true
		}
		if (this.side_frame != 0) {
			this.side_frame++
			if (this.side_frame > 40) {
				this.side_frame = 0
			}
		}
		if (this.magatt_frame != 0) {
			this.magatt_frame++
			if (this.magatt_frame > 40) {
				this.magatt_frame = 0
			}
		}
		// console.log(this.state)
		return state_change
	}
	KeyMove(key: string) {
		if (this.state == MyState.DEAD) {
			return
		}
		// console.log(key)
		if (key == "a") {
			this.state = MyState.NORMAL
			this.speed.x = -3
			this.direction = -1
		}
		else if (key == "d") {
			this.state = MyState.NORMAL
			this.speed.x = 3
			this.direction = 1
		}
		else if (key == "w" && on_ground(this.nowPosition, this.sprite.length)) {
			this.state = MyState.NORMAL
			this.speed.y = -15
		}
		else if (key == "j") {
			if (this.state == MyState.NORMAL) {
				this.state = MyState.ATTACK
			}
			// "₍ᐢ..ᐢ↗""₍ᐢ..ᐢ↘"
		}
		else if (key == "u") {
			if (this.state == MyState.NORMAL) {
				this.state = MyState.MAGATT
			}
		}
		else if (key == "l") {
			if (this.state == MyState.NORMAL) {
				this.state = MyState.SIDE
			}
		}
		else if (key == "k") {
			this.state = MyState.DEFEN
		}
		// else if (key == "s" && on_ground(this.nowPosition, this.sprite.length)) {
		// 	this.speed.x = 0.2
		// }
	}
	Dead() {
		if (this.state != MyState.DEFEN) {
			this.state = MyState.DEAD
			render_list.push([Math.round(this.nowPosition.x), Math.round(this.nowPosition.y), " ".repeat(this.last_sprite.length), 0])
		}
	}
}

export class IntObject extends BaseObject {
	attack_frame = 0
	def_frame = 0
	constructor(p_x, p_y) {
		super(p_x, p_y, "int", 1)
	}
	StateProc(): boolean {
		let state_change = false
		if (this.state == MyState.ATTACK) {
			if (this.attack_frame == 0) {
				state_change = true
				if (this.direction == 1) {
					this.show_sprite = "in}"
				}
				else {
					this.show_sprite = "{nt"
				}
			}
			else if (this.attack_frame == 10) {
				state_change = true
				if (this.direction == 1) {
					this.show_sprite = "in>"
				}
				else {
					this.show_sprite = "<nt"
				}
				if (NormalAttackJudge(this, my_player, 2)) {
					my_player.InAttack(this.direction)
				}
			}
			else if (this.attack_frame == 20) {
				this.state = MyState.NORMAL
				this.attack_frame = -1
				state_change = true
			}
			this.attack_frame++
		}
		else if (this.state == MyState.DEFEN) {
			if (this.def_frame == 0) {
				this.show_sprite = "in|"
				if (this.direction == -1) {
					this.show_sprite = "|nt"
				}
				state_change = true
			}
			else if (this.def_frame == 50) {
				this.state = MyState.NORMAL
				state_change = true
				this.def_frame = -1
			}
			this.def_frame++
		}
		return state_change
	}
	Move() {
		if (this.state == MyState.NORMAL && this.speed.x * this.speed.x < 0.5) {
			if (NormalAttackJudge(this, my_player, 2)) {
				if (this.state == MyState.NORMAL) {
					this.state = MyState.ATTACK
				}
			}
			else if (my_player.nowPosition.x < this.nowPosition.x) {
				this.direction = -1
				this.speed.x = -3
			}
			else {
				this.direction = 1
				this.speed.x = 3
			}
		}
		if (this.state == MyState.NORMAL || this.state == MyState.ATTACK) {
			object_list.forEach((v, i) => {
				if (NormalAttackJudge(v, this, 2)) {
					this.state = MyState.DEFEN
				}
			})
			if (my_player.state == MyState.ATTACK && my_player.direction != this.direction && NormalAttackJudge(my_player, this, 3)) {
				this.state = MyState.DEFEN
			}
		}
	}
}

export class FloatObject extends BaseObject {
	attack_frame = 0
	constructor(p_x, p_y) {
		super(p_x, p_y, "float", 1)
	}
	StateProc(): boolean {
		let state_change = false
		if (this.state == MyState.ATTACK) {
			if (this.attack_frame == 0) {
				let offset = this.last_sprite.length
				if (this.direction == -1) {
					offset = -1
				}
				let tmp = new Item(this.nowPosition.x + offset, this.nowPosition.y, 3 * this.direction, 0, "-", ObjState.ENEMY)
				object_list.push(tmp)
			}
			if (this.attack_frame == 100) {
				this.state = MyState.NORMAL
				this.attack_frame = -1
				state_change = true
			}
			this.attack_frame++
		}
		return state_change
	}
	Move() {
		if (Math.round(my_player.nowPosition.y - this.nowPosition.y) == 0 && this.attack_frame == 0) {
			if (my_player.nowPosition.x < this.nowPosition.x) {
				this.direction = -1
			}
			else {
				this.direction = 1
			}
			this.state = MyState.ATTACK
		}
		else if (Math.abs(my_player.nowPosition.x - this.nowPosition.x) > 30) {
			if (my_player.nowPosition.x < this.nowPosition.x) {
				this.direction = -1
				this.speed.x = -3
			}
			else {
				this.direction = 1
				this.speed.x = 3
			}
		}
		else if (Math.abs(my_player.nowPosition.x - this.nowPosition.x) < 10) {
			if (my_player.nowPosition.x < this.nowPosition.x) {
				this.direction = 1
				this.speed.x = 3
			}
			else {
				this.direction = -1
				this.speed.x = -3
			}
		}
		if (!collision_x(this.nowPosition, this.speed.x * 0.1, this.sprite.length) && on_ground(this.nowPosition, this.sprite.length)) {
			this.speed.y = -10
		}
	}
}

export class ForObject extends BaseObject {

	attack_frame = 0

	constructor(p_x, p_y) {
		super(p_x, p_y, "for", 1)
	}
	GravityProc() { }
	StateProc(): boolean {
		let state_change = false
		if (this.state == MyState.ATTACK) {
			if (this.attack_frame == 0) {
				let tmp = new Item(this.nowPosition.x, this.nowPosition.y + 1, 0, 1, "o", ObjState.ENEMY)
				object_list.push(tmp)
			}
			if (this.attack_frame == 100) {
				this.state = MyState.NORMAL
				this.attack_frame = -1
				state_change = true
			}
			this.attack_frame++
		}
		return state_change
	}
	Move() {
		let i = Math.round(this.nowPosition.y) + 1
		while (i < map.length && (Math.round(this.nowPosition.x) >= map[i].length || map[i][Math.round(this.nowPosition.x)].trim() == '')) {
			i++
		}
		let high = i - Math.round(this.nowPosition.y)
		if (high < 5) {
			this.speed.y = -1
		}
		else if (high > 7) {
			this.speed.y = +1
		}
		else if (this.speed.y == 0) {
			this.speed.y = randomInt(-1, 2);
		}
		if (Math.abs(my_player.nowPosition.x + my_player.sprite.length / 2 - this.nowPosition.x - this.sprite.length / 2) < my_player.sprite.length / 2 + this.sprite.length / 2 + 1) {
			if (this.state == MyState.NORMAL) {
				this.state = MyState.ATTACK
			}
		}
		else if (my_player.nowPosition.x < this.nowPosition.x) {
			this.direction = -1
			this.speed.x = -1
		}
		else {
			this.direction = 1
			this.speed.x = 1
		}
	}
}