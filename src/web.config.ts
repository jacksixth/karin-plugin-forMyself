import { Config } from "config/config/config.d"
import { components, logger, writeJsonSync } from "node-karin"
import { config, dirConfig } from "./utils"
const defConfig = config()
export default {
  info: {
    // 插件信息配置
  },
  /** 动态渲染的组件 */
  components: () => [
    components.input.group("notifyGroupNos", {
      label: "日报每天定时发送群聊群号",
      template: {
        componentType: "input",
        key: "notifyGroupNos",
        type: "text",
        variant: "faded",
        placeholder: "请输入群号",
      },
      data: [...defConfig.notifyGroupNos],
    }),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    // 在这里处理保存逻辑
    logger.info("保存的配置:", config)
    //新配置覆盖旧配置
    Object.assign(defConfig, config)
    writeJsonSync(`${dirConfig}/config.json`, config)
    return {
      success: true,
      message: "保存成功",
    }
  },
}
