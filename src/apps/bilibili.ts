import { karin, logger } from "node-karin"
import axios from "node-karin/axios"
import { config } from "../utils/index"
import { getVideoInfo } from "../utils/libs/video"
import { getDynamicInfo } from "../utils/libs/dynamic"
import { getLiveRoomInfo } from "../utils/libs/live"
import { getArticleInfo } from "../utils/libs/article"
//bilibili 解析
const _config = config()
const reg = new RegExp(
  /(((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+)|(bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+)))|(t\.bilibili\.com\/(\d+))|(m\.bilibili\.com\/dynamic\/(\d+))|(www\.bilibili\.com\/opus\/(\d+))|(bilibili\.com\/read\/(?:cv|mobile\/)(\d+))|(live\.bilibili\.com\/blanc\/(\d+))|com\.tencent\.miniapp_01/gi
)
export const bilibili = karin.command(reg, async (e) => {
  const firstMessage = e.elements[0]
  let url
  let isMiniProgram = false
  if (firstMessage.type === "text") {
    url = firstMessage.text
  } else if (firstMessage.type === "json") {
    const data = JSON.parse(firstMessage.data)
    url = data?.meta?.detail_1?.qqdocurl || data?.meta?.news?.jumpUrl
    isMiniProgram = firstMessage.data.includes("com.tencent.miniapp_01")
  }
  if (!url) return false
  const param = await getIdFromMsg(url)
  const { avid, bvid, dyid, arid, lrid } = param
  if (!avid && !bvid && !arid && !dyid && !lrid) return false

  if (isMiniProgram) {
    if (e.subEvent === "group" && _config.recallMiniProgram) {
      const userInfo = await e.bot.getGroupMemberInfo(e.groupId, e.bot.selfId)
      if (
        userInfo.role === "owner" ||
        (userInfo.role === "admin" && e.sender.role === "member")
      ) {
        await e.bot.recallMsg(e.contact, e.messageId)
      }
    }
  }

  if (_config.getInfo.getVideoInfo && (avid || bvid)) {
    const res = await getVideoInfo({ aid: avid, bvid }, logger)
    karin.sendMsg(e.bot.selfId, e.contact, res)
    return false
  }

  if (_config.getInfo.getLiveRoomInfo && lrid) {
    const res = await getLiveRoomInfo(lrid, logger)
    karin.sendMsg(e.bot.selfId, e.contact, res)
    return false
  }
  if (_config.getInfo.getArticleInfo && arid) {
    const res = await getArticleInfo(arid, logger)
    karin.sendMsg(e.bot.selfId, e.contact, res)
    return false
  }

  if (_config.getInfo.getDynamicInfo && dyid) {
    const res = await getDynamicInfo(dyid, logger)
    karin.sendMsg(e.bot.selfId, e.contact, res)
    return false
  }

  return false
})

const getIdFromMsg = async (msg: string) => {
  const match = /((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+/.exec(msg)
  if (match) return getIdFromShortLink(`https://${match[0]}`)
  return getIdFromNormalLink(msg)
}

const getIdFromNormalLink = (link: string) => {
  const searchVideo =
    /bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) || []
  const searchDynamic =
    /t\.bilibili\.com\/(\d+)/i.exec(link) ||
    /m\.bilibili\.com\/dynamic\/(\d+)/i.exec(link) ||
    /www\.bilibili\.com\/opus\/(\d+)/i.exec(link) ||
    []
  const searchArticle =
    /bilibili\.com\/read\/(?:cv|mobile\/)(\d+)/i.exec(link) || []
  const searchLiveRoom = /live\.bilibili\.com\/blanc\/(\d+)/i.exec(link) || []
  return {
    avid: searchVideo[1],
    bvid: searchVideo[2],
    dyid: searchDynamic[1],
    arid: searchArticle[1],
    lrid: searchLiveRoom[1],
  }
}

const getIdFromShortLink = async (shortLink: string) => {
  return await axios
    .head(shortLink, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    })
    .then((ret) => getIdFromNormalLink(ret.headers.location))
    .catch((error) => {
      logger.error(`B站短链转换失败 ${shortLink}`)
      logger.error(error)
      return {
        avid: undefined,
        bvid: undefined,
        dyid: undefined,
        arid: undefined,
        lrid: undefined,
      }
    })
}
