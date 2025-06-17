// 感谢人美心善 瑜笙[https://github.com/yusheng929]大神开源 代码首发Q群967068507
/** Karin版俄罗斯转盘
 * 首发群聊 967068507
 * 禁止用于商业化
 */

import karin from "node-karin"
type OneGunState = {
  realBullets: number
  bullets: number
}

type MultipleGunState = {
  bulletNum: number
  players: {
    [QQNum: string]: {
      bullets: number
      realBullets: number
    }
  }
}

type GameState =
  | null
  | (OneGunState & { gameMode: "oneGun" })
  | (MultipleGunState & { gameMode: "multipleGun" })

const data: { [key: string]: GameState } = {}

// 开始游戏 [弹巢]? [模式 1|2]?
export const startgame = karin.command(
  /^#?(?:开始游戏)(?:\s+(\S+)(?:\s+(\S+))?)?$/,
  async (e) => {
    if (data[e.groupId]) {
      await e.reply("游戏正在进行中", { reply: true })
      return true
    }
    const regRes = e.msg.match(/^#?(?:开始游戏)(?:\s+(\S+)(?:\s+(\S+))?)?$/)
    if (!regRes) {
      //不会走到这里
      await e.reply("格式错误", { reply: true })
      return true
    }
    const [_, _bulletNum, mode] = regRes
    let bulletNum: string = "6"
    let gameMode: "oneGun" | "multipleGun"

    if (!_bulletNum) {
      gameMode = "oneGun"
    } else {
      bulletNum = _bulletNum
    }
    if (isNaN(parseInt(bulletNum)) || parseInt(bulletNum) < 2) {
      await e.reply("弹巢参数错误,应为大于1的数字", { reply: true })
      return true
    }

    if (!mode) {
      gameMode = "oneGun"
    } else if (mode === "1") {
      gameMode = "oneGun"
    } else if (mode === "2") {
      gameMode = "multipleGun"
    } else {
      await e.reply("游戏模式参数错误，应为 1 或 2", { reply: true })
      return true
    }
    let save = null
    if (gameMode === "oneGun") {
      save = {
        realBullets: Math.floor(Math.random() * parseInt(bulletNum)) + 1,
        bullets: parseInt(bulletNum),
        gameMode,
      }
    } else {
      save = {
        gameMode,
        bulletNum: parseInt(bulletNum),
        players: {},
      }
    }
    data[e.groupId] = save
    e.reply(
      `游戏开始，当前为模式为${
        gameMode == "oneGun" ? "单枪模式" : "多枪模式"
      }，左轮弹巢可以装${bulletNum}发子弹，现在装了一发，现在弹巢转动起来咯。`
    )
  },
  {
    event: "message.group",
    perm: "group.admin",
  }
)
export const turntable = karin.command(
  /^#?开枪$/,
  async (e) => {
    const groupId = e.groupId!
    let save = data[groupId]
    if (!save) {
      await e.reply("❌ 游戏还没开始呢", { reply: true })
      return true
    }
    if (save.gameMode == "oneGun") {
      if (save.bullets - 1 === 0) {
        await e.reply(`砰！枪响了，${e.sender.nick}似了，游戏结束`, {
          reply: true,
        })
        data[e.groupId] = null
        return true
      }
      const match = Math.floor(Math.random() * save.bullets) + 1
      if (match === save.realBullets) {
        await e.reply(`砰！枪响了，${e.sender.nick}似了，游戏结束`, {
          reply: true,
        })
        data[e.groupId] = null
        return true
      } else {
        save.bullets -= 1
        await e.reply(
          `砰！枪响了,这一发没装子弹,剩${save.bullets}枪,游戏继续`,
          {
            reply: true,
          }
        )
        data[e.groupId] = save
        return true
      }
    } else if (save.gameMode === "multipleGun") {
      let player = save.players[e.sender.userId]
      if (!player) {
        //加入游戏
        save.players[e.sender.userId] = {
          realBullets: Math.floor(Math.random() * save.bulletNum) + 1,
          bullets: save.bulletNum,
        }
        await e.reply(
          `加入游戏，你当前可开枪数：${save.players[e.sender.userId].bullets}`,
          {
            reply: true,
          }
        )
      }
      player = save.players[e.sender.userId]
      //已中枪
      if (player.bullets < 1) {
        await e.reply(`你已经似了,请等待重新开局`, { reply: true })
        return true
      }
      //开枪
      if (player.bullets - 1 === 0) {
        await e.reply("砰！枪响了，你似了", { reply: true })
        player.bullets = 0
        save.players[e.sender.userId] = player
        data[groupId] = save
        return true
      }
      const match = Math.floor(Math.random() * player.bullets) + 1
      if (match == player.realBullets) {
        await e.reply("砰！枪响了，你似了", { reply: true })
        player.bullets = 0
        save.players[e.sender.userId] = player
        data[groupId] = save
        return true
      } else {
        player.bullets -= 1
        save.players[e.sender.userId] = player
        data[groupId] = save
        await e.reply(`砰！枪响了,这一发没装子弹,剩${player.bullets}枪`, {
          reply: true,
        })
        return true
      }
    }
  },
  {
    event: "message.group",
  }
)

export const resetgame = karin.command(
  /^#?结束游戏$/,
  async (e) => {
    if (!data[e.groupId]) {
      await e.reply("没有进行中的游戏", { reply: true })
      return true
    }
    data[e.groupId] = null
    await e.reply("游戏已结束", { reply: true })
    return true
  },
  { perm: "group.admin", event: "message.group" }
)
