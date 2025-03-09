export interface Config {
  //当小程序分享解析成功时是否撤回该小程序，仅在群组内且有管理员权限且发送者是普通成员时有效
  recallMiniProgram: boolean
  getInfo: {
    getVideoInfo: boolean //是否获取并输出视频信息
    getDynamicInfo: boolean //是否获取并输出动态内容
    getArticleInfo: boolean //是否获取并输出专栏信息
    getLiveRoomInfo: boolean //是否获取并输出直播间信息
  }
  notifyGroupNos: Array<string> //每天定时发送日报的群号
}
