import karin, { Contact, logger, segment } from "node-karin"
import axios from "node-karin/axios"

//定时发送每日资讯摸鱼日报的群号
const NOTICE_GROUP_NO = ["832305015"]

const meirizixunApi = "https://dayu.qqsuu.cn/weiyujianbao/apis.php?type=json"
const moyuribaoApi = "https://dayu.qqsuu.cn/moyuribao/apis.php?type=json"
//定时发送日报
export const ribaoTask = karin.task(
  "moyuribao",
  "0 0 9 ? * MON-FRI",
  async () => {
    await sendImg(NOTICE_GROUP_NO, "group")
  }
)
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
  try {
    //每日资讯
    const mrzx = await axios.get(meirizixunApi)
    //摸鱼日报
    const myrb = await axios.get(moyuribaoApi)
    return {
      mrzx: mrzx.data?.code == 200 ? mrzx.data.data : undefined,
      myrb: myrb.data?.code == 200 ? myrb.data.data : undefined,
    }
  } catch (error) {
    logger.error(error)
    return {
      mrzx: undefined,
      myrb: undefined,
    }
  }
}
