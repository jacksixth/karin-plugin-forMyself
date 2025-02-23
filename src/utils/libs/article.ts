import axios from "node-karin/axios"
import { humanNum } from "./utils"
import { Logger } from "node-karin"
import { segment } from "node-karin"
import { USER_AGENT } from "./const"

export const getArticleInfo = async (id: string, logger: Logger) => {
  try {
    const response = await axios.get(
      `https://api.bilibili.com/x/article/viewinfo?id=${id}`,
      {
        timeout: 10000,
        headers: {
          "User-Agent": USER_AGENT,
        },
      }
    )

    const { code, message, data } = response.data

    if (code !== 0) return [segment.text(`Error: (${code})${message}`)]

    const {
      stats: { view, reply },
      title,
      author_name,
      origin_image_urls: [img],
    } = data

    return [
      segment.image(img),
      segment.text(
        [
          title,
          `UP: ${author_name}`,
          `${humanNum(view)}阅读 ${humanNum(reply)}评论`,
          `https://www.bilibili.com/read/cv${id}`,
        ].join("\n")
      ),
    ]
  } catch (error) {
    logger.error(`B站文章信息获取失败`)
    logger.error({ id })
    logger.error(error)
    return [segment.text("文章信息获取失败~")]
  }
}
