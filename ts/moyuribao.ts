/**
 * @file 日报插件
 * @author jacksixth
 * @license GPL-3.0-only
 * @description 1. 发送 #日报 时，获取摸鱼日报和每日资讯，并发送。2. 每天定时发送摸鱼日报和每日资讯到指定群组。
 */
import karin, { Contact, logger, segment } from "node-karin"
import axios from "node-karin/axios"
const _config = {
  notifyGroupNos: [""], //每天定时发送日报的群号
}
// 在文件顶部添加https模块引入
import https from "https"

// 创建忽略SSL验证的httpsAgent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})
//定时发送日报   0 0 9 ? * * 为每天早上9:00
export const ribaoTask = karin.task("moyuribao", "0 0 9 ? * *", async () => {
  const NOTICE_GROUP_NO = _config.notifyGroupNos
  sendImg(NOTICE_GROUP_NO, "group")
  // NOTICE_GROUP_NO.forEach((groupNo) => {
  //   const contact = karin.contact("group", groupNo + "")
  //   karin.sendMsg(karin.getBotAll()[1].account.selfId, contact, [
  //     segment.image("https://dayu.qqsuu.cn/moyuribao/apis.php"),
  //     segment.image("https://dayu.qqsuu.cn/weiyujianbao/apis.php"),
  //   ])
  // })
})
//摸鱼日报、每日资讯API 可以自行替换
const meirizixunApi = "https://dayu.qqsuu.cn/weiyujianbao/apis.php?type=json"
const moyuribaoApi = "https://dayu.qqsuu.cn/moyuribao/apis.php?type=json"
//主动获取摸鱼日报、每日资讯
export const ribao = karin.command(
  /^#?日报$/,
  async (e) => {
    if (e.isGroup) {
      await sendImg([e.groupId], "group")
    } else if (e.isPrivate) {
      await sendImg([e.userId], "private")
    }
    return true
  },
  {
    /** 插件优先级 */
    priority: 9999,
    /** 插件触发是否打印触发日志 */
    log: true,
    /** 插件名称 */
    name: "日报",
    /** 谁可以触发这个插件 'all' | 'master' | 'admin' | 'group.owner' | 'group.admin' */
    permission: "all",
    at: true,
  }
)

//获取图片地址并发送
const sendImg = async (sendNoList: string[], type: "group" | "private") => {
  const imgAddress = await getImgAddress()
  const myrb = imgAddress.myrb && segment.image(imgAddress.myrb)
  const mrzx = imgAddress.mrzx && segment.image(imgAddress.mrzx)
  sendNoList.forEach(async (sendNo) => {
    let contact: Contact
    if (type === "group") contact = karin.contact("group", sendNo)
    else contact = karin.contact("friend", sendNo)
    if (myrb && mrzx)
      karin.sendMsg(karin.getBotAll()[1].account.selfId, contact, [myrb, mrzx])
    else if (myrb)
      karin.sendMsg(karin.getBotAll()[1].account.selfId, contact, myrb)
    else if (mrzx)
      karin.sendMsg(karin.getBotAll()[1].account.selfId, contact, mrzx)
    else {
      karin.sendMsg(
        karin.getBotAll()[1].account.selfId,
        contact,
        segment.text("今天没有摸鱼日报和每日资讯哦")
      )
    }
  })
}

//获取摸鱼日报、每日资讯图片地址
const getImgAddress = async () => {
  let myrbImg: string | undefined = undefined
  let mrzxImg: string | undefined = undefined
  try {
    //摸鱼日报
    const myrb = await axios.get(moyuribaoApi, {
      httpsAgent,
    })
    //把返回的图片链接下载到本地转base64
    if (myrb.data?.code == 200) myrbImg = await downloadImg(myrb.data?.data)
  } catch (error) {
    logger.error(error)
  }
  try {
    //每日资讯
    const mrzx = await axios.get(meirizixunApi, {
      httpsAgent,
    })
    if (mrzx.data?.code == 200) mrzxImg = await downloadImg(mrzx.data?.data)
  } catch (error) {
    logger.error(error)
  }
  return {
    myrb: myrbImg,
    mrzx: mrzxImg,
  }
}
//下载图片并转为Buffer
const downloadImg = async (imgUrl: string) => {
  try {
    const response = await axios.get(imgUrl, {
      responseType: "arraybuffer",
      httpsAgent,
      validateStatus: (status) => status === 200, // 校验响应状态码
    })
    const img = Buffer.from(response.data, "binary")
    //把图片转为string的base64格式
    return "base64://" + img.toString("base64")
  } catch (error) {
    logger.error(error)
    return undefined
  }
}
