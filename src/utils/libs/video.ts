import axios from "node-karin/axios"
import { humanNum } from "./utils.ts"
import { USER_AGENT } from "./const.ts"
import { Logger } from "node-karin"
import { segment } from "node-karin"

export const getVideoInfo = async (
  params: { aid?: string; bvid?: string },
  logger: Logger
) => {
  try {
    const response = await axios.get(
      `https://api.bilibili.com/x/web-interface/view`,
      {
        params,
        timeout: 10000,
        headers: {
          "User-Agent": USER_AGENT,
        },
      }
    )

    const { code, message, data } = response.data

    if (code === -404) return [segment.text("该视频已被删除")]
    if (code !== 0) return [segment.text(`Error: (${code})${message}`)]

    const {
      bvid,
      aid,
      pic,
      title,
      owner: { name },
      stat: { view, danmaku },
    } = data

    return [
      segment.image(pic),
      segment.text(
        [
          `av${aid}`,
          title,
          `UP: ${name}`,
          `${humanNum(view)}播放 ${humanNum(danmaku)}弹幕`,
          `https://www.bilibili.com/video/${bvid}`,
        ].join("\n")
      ),
    ]
  } catch (error) {
    logger.error(`B站视频信息获取失败`)
    logger.error(params)
    logger.error(error)
    return [segment.text("视频信息获取失败~")]
  }
}
