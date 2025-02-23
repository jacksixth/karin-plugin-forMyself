import { Config } from "config/config/config.d"
import { components, logger, writeJsonSync } from "node-karin"
import { config, dirConfig } from "./utils"
const defConfig = config()
export default {
  info: {
    // 插件信息配置
  },
  /** 动态渲染的组件 */
  components: () => [],

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    // 在这里处理保存逻辑
    logger.info("保存的配置:", config)
    // writeJsonSync(`${dirConfig}/config.json`, config)
    return {
      success: true,
      message: "保存成功",
    }
  },
}
