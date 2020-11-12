import { degrees2radians, radians2degrees, inRect, euclidDistance } from './util'
import { inspector } from './store'

export const HP = 3
const BULLET_SPEED = 3
const MAX_BULLET = 5
const BULLET_INTERVAL = 15
const ROBOT_RADIUS = 10
const SEQUENTIAL_EVENTS = ["move_forwards", "move_backwards", "turn_left", "turn_right", "move_opposide"]

//const PARALLEL_EVENTS = ["shoot", "turn_turret_left", "turn_turret_right", "turn_radar_left", "turn_radar_right"]

interface Event {
  action?: string
  msg?: string
  progress?: number
  amount?: number
  yell?: string
  shoot?: boolean
  turn_left?: number
  turn_right?: number
  move_forwards?: number
  move_backwrds?: number
  move_opposide?: number
  turn_turret_left?: number
  turn_turret_right?: number
  data?: any
}

interface Status {
  wall_collide: boolean
  is_hit: boolean
}

interface Bullet {
  x: number
  y: number
  direction: number
}

interface Info {
  id: number
  x: number
  y: number
  hp: number
  angle: number
  tank_angle: number
  turret_angle: number
}

export class Robot {

  static battlefield_width: number = 0
  static battlefield_height: number = 0

  me: Info
  data: any = undefined
  id: number = 0
  hp: number = HP

  tank_angle: number = Math.random() * 360
  turret_angle: number = Math.random() * 360
  radar_angle: number = Math.random() * 360
  event_counter: number = 0

  events: Event[] = []
  bullets: Bullet[] = []
  status: Status = {
    wall_collide: false,
    is_hit: false
  }

  is_hit = false
  is_yell = false
  yell_ts = 0
  yell_msg = undefined
  bullet_ts = 0
  enemy_spot = []
  action_to_collide = 0
  waiting_for_response = false

  x: number
  y: number
  url: string

  enemies: Robot[] = []

  completed_request: (msg: string, ok: boolean) => void
  hit_robot: (x: number, y: number) => void

  constructor(x: number, y: number, url: string,
    completed_request: (msg: string, ok: boolean) => void,
    hit_robot: (x: number, y: number) => void) {
    this.x = x
    this.y = y
    this.url = url
    this.completed_request = completed_request
    this.hit_robot = hit_robot
  }

  init(enemies: Robot[]) {
    this.enemies = enemies
  }

  move(distance: number) {
    let newX = this.x + distance * Math.cos(degrees2radians(this.tank_angle));
    let newY = this.y + distance * Math.sin(degrees2radians(this.tank_angle));

    if (inRect(newX, newY, 15, 15,
      Robot.battlefield_width - 15,
      Robot.battlefield_height - 15)) {
      // hit the wall
      //console.log("not-wall-collide")
      this.status.wall_collide = false
      this.x = newX
      this.y = newY
    } else {
      console.log("wall-collide")
      this.status.wall_collide = true
    }
  }

  turn(degrees: number) {
    this.tank_angle += degrees
    this.tank_angle = this.tank_angle % 360
    if (this.tank_angle < 0)
      this.tank_angle += 360
  }

  turn_turret(degrees: number) {
    this.turret_angle += degrees
    this.turret_angle = this.turret_angle % 360
    if (this.turret_angle < 0)
      this.turret_angle += 360
  }

  yell(msg: string) {
    this.is_yell = true
    this.yell_ts = 0
    this.yell_msg = msg
  }

  receive(event: Event) {
    this.waiting_for_response = false
    if (event.action == "shoot") {
      if (this.bullets.length >= MAX_BULLET || this.bullet_ts < BULLET_INTERVAL) {
        return
      }
      this.bullet_ts = 0
      let bullet: Bullet = {
        x: this.x, y: this.y,
        direction: this.tank_angle + this.turret_angle
      }
      this.bullets.push(bullet)
      return
    }
    // remove duplicate events
    // FIXME improve performance
    if (event.action == "turn_turret_left")
      for (let ev of this.events)
        if (ev.action == "turn_turret_left")
          return

    if (event.action == "turn_turret_right")
      for (let ev of this.events)
        if (ev.action == "turn_turret_right")
          return

    if (event.action == "data") {
      this.data = event.data
    }

    if (event.action == "yell")
      if (this.yell_ts == 0) {
        this.yell(event.msg)
        return
      }

    event.progress = 0
    console.log("queuing receive", event)
    this.events.push(event)
  }

  async send(msg: object): Promise<boolean> {
    let json = JSON.stringify(msg, null, 2)
    ++this.event_counter
    inspector.update((info) => { info[this.id][0] = json; info[this.id][2] = "" + this.event_counter; return info })
    //this.last_sent = JSON.stringify(msg, null, 2)
    this.waiting_for_response = true
    return fetch(this.url, {
      "method": 'POST',
      "headers": { 'Content-Type': 'application/json' },
      "body": json
    }).then(response => response.text()
    ).then((json) => {
      //console.log(json)  
      this.waiting_for_response = false
      for (let event of this.decode(json)) {
        this.receive(event)
      }
      // stop after this sendrec
      this.completed_request("Round completed.", true)
      return true
    }).catch((err) => {
      this.waiting_for_response = false
      console.log(err)
      this.completed_request("Server error.", false)
      return false
    })
  }

  async send_event(event): Promise<boolean> {
    return this.send({
      "event": event,
      "me": this.me,
      "enemy-spot": this.enemy_spot,
      "status": this.status,
      "data": this.data
    })
  }

  check_enemy_spot() {
    this.enemy_spot = []
    let is_spot = false
    for (let enemy_robot of this.enemies) {
      let my_angle = (this.tank_angle + this.turret_angle) % 360
      my_angle = my_angle < 0 ? my_angle : 360 + my_angle
      let my_radians = degrees2radians(my_angle)
      let enemy_position_radians = Math.atan2(enemy_robot.y - this.y, enemy_robot.x - this.x)
      let distance = euclidDistance(this.x, this.y, enemy_robot.x, enemy_robot.y)
      let radians_diff = Math.atan2(ROBOT_RADIUS, distance)

      // XXX a dirty shift
      my_radians = Math.abs(my_radians)
      if (my_radians > Math.PI)
        my_radians -= (2 * Math.PI)
      if (my_radians < -Math.PI)
        my_radians += (2 * Math.PI)

      let max = enemy_position_radians + radians_diff
      let min = enemy_position_radians - radians_diff

      //# console.log "max = #{max}"
      //# console.log "min = #{min}"
      //# console.log "my-radians = #{my-radians}"
      //# console.log "diff =" + radians-diff

      if (my_radians >= min && my_radians <= max) {
        let enemy_position_degrees = radians2degrees(enemy_position_radians)
        if (enemy_position_degrees < 0)
          enemy_position_degrees = 360 + enemy_position_degrees
        this.enemy_spot.push({ id: enemy_robot.id, angle: enemy_position_degrees, distance: distance, hp: enemy_robot.hp, x: enemy_robot.x, y: enemy_robot.y })
        is_spot = true
      }
    }
    if (is_spot)
      return true
    return false
  }

  update_bullet() {
    let i = -1
    for (let b of this.bullets) {
      i++
      b.x += BULLET_SPEED * Math.cos(degrees2radians(b.direction))
      b.y += BULLET_SPEED * Math.sin(degrees2radians(b.direction))
      let bullet_wall_collide = !inRect(b.x, b.y, 2, 2, Robot.battlefield_width - 2, Robot.battlefield_height - 2)
      if (bullet_wall_collide) {
        b = null
        this.bullets.splice(i, 1)
        continue
      }

      let j = -1
      for (let enemy_robot of this.enemies) {
        j++
        let robot_hit = (euclidDistance(b.x, b.y, enemy_robot.x, enemy_robot.y) < 20)
        if (robot_hit) {
          enemy_robot.hp -= 3
          enemy_robot.is_hit = true
          this.hit_robot(enemy_robot.x, enemy_robot.y)
          b = null
          this.bullets.splice(j, 1)
          break
        }
      }
    }
  }

  async update() {
    console.log("update")
    this.me = {
      angle: (this.tank_angle + this.turret_angle) % 360,
      tank_angle: this.tank_angle,
      turret_angle: this.turret_angle,
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp
    }

    //console.log(this.me)
    let is_turning_turret = false
    if (this.bullet_ts == Number.MAX_VALUE)
      this.bullet_ts = 0
    else
      this.bullet_ts++

    if (this.bullets.length > 0)
      this.update_bullet()

    if (this.is_hit) {
      this.events = []
      this.status.is_hit = true
      this.is_hit = false
      await this.send_event("hit")
      return
    }

    if (this.check_enemy_spot()) {
      await this.send_event("enemy-spot")
    }

    let has_sequential_event = false
    let newEvents = []
    //console.log(this.events)
    for (let event of this.events) {
      //console.log("inspecting", event)
      if (SEQUENTIAL_EVENTS.indexOf(event.action) != -1) {
        if (has_sequential_event) {
          continue
        }
        has_sequential_event = true
      }

      //console.log(`events[${event.event_id}] = {action=${event.action},progress=${event.progress}}`)
      if (event && event.amount > event.progress) {
        newEvents.push(event)
        //console.log("reading", event)
        switch (event.action) {
          case "move_forwards":
            event.progress++
            this.move(1)
            if (this.status.wall_collide) {
              this.action_to_collide = 1 //#forward
              newEvents = []
              await this.send_event("wall-collide")
              break
            }

          case "move_backwards":
            event.progress--
            this.move(-1)
            if (this.status.wall_collide) {
              this.action_to_collide = -1 //#backward
              newEvents = []
              await this.send_event("wall-collide")
              break
            }

          case "move_opposide":
            event.progress++
            this.move(-this.action_to_collide)
            if (this.status.wall_collide) {
              this.action_to_collide = -this.action_to_collide
              newEvents = []
              await this.send_event("wall-collide")
              break
            }

          case "turn_left":
            event.progress++
            this.turn(-1)

          case "turn_right":
            event.progress++
            this.turn(1)

          case "turn_turret_left":
            if (is_turning_turret)
              continue
            event.progress++
            this.turn_turret(-1)
            is_turning_turret = true

          case "turn_turret_right":
            if (is_turning_turret)
              continue
            event["progress"]++
            this.turn_turret(1)
            is_turning_turret = true
        }
      }
    }
    this.events = newEvents
    // notify idle
    if (this.events.length == 0 && !this.waiting_for_response) {
      await this.send_event("idle")
    }
  }

  decode(json: string): Event[] {
    let data: Event | Array<Event> = JSON.parse(json)
    inspector.update((info) => { info[this.id][1] = JSON.stringify(data, null, 2); return info })
    let events: Event[]
    let res: Event[] = []
    if (data instanceof Event) {
      events = [data as Event]
    } else if (Array.isArray(data)) {
      events = data
    } else {
      events = []
    }
    // expand commands
    for (let event of events) {
      // it is an action
      if ("action" in event) {
        res.push(event)
        continue
      }
      // short form
      if ("data" in event) {
        res.push({
          "action": "state",
          "data": event["data"]
        })
      }
      if ("yell" in event) {
        res.push({
          "action": "yell",
          "msg": event["yell"]
        })
      }
      if ("shoot" in event) {
        if (event.shoot)
          res.push({ "action": "shoot" })
      }
      // left or right but not both
      if ("turn_turret_right" in event) {
        res.push({
          "action": "turn_turret_right",
          "amount": event["turn_turret_right"]
        })
      } else if ("turn_turret_left" in event) {
        res.push({
          "action": "turn_turret_left",
          "amount": event["turn_turret_left"]
        })
      }
      // sequential actions
      if ("move_opposide" in event) {
        res.push({
          "action": "move_opposide",
          "amount": event["mode_opposide"]
        })
        continue
      }
      if ("move_forwards" in event) {
        res.push({
          "action": "move_forwards",
          "amount": event["move_forwards"]
        })
        continue
      }
      if ("move_backwards" in event) {
        res.push({
          "action": "move_backwards",
          "amount": event["move_backwards"]
        })
        continue
      }
      if ("move_backwards" in event) {
        res.push({
          "action": "move_backwards",
          "amount": event["move_backwards"]
        })
        continue
      }
      if ("turn_left" in event) {
        res.push({
          "action": "turn_left",
          "amount": event["turn_left"]
        })
        continue
      }
      if ("turn_right" in event) {
        res.push({
          "action": "turn_right",
          "amount": event["turn_right"]
        })
        continue
      }
    }
    return res

  }
}
