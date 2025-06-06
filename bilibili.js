/**
 * @file B站链接解析
 * @author jacksixth
 * @license GPL-3.0-only
 * @description 解析B站视频、直播、动态、专栏等链接，并获取相关信息
 */
import { karin, logger, segment } from "node-karin";
import axios from "node-karin/axios";
//bilibili 解析配置
const _config = {
    //当小程序分享解析成功时是否撤回该小程序，仅在群组内且有管理员权限且发送者是普通成员时有效
    recallMiniProgram: true,
    getInfo: {
        getVideoInfo: true, //是否获取并输出视频信息
        getDynamicInfo: true, //是否获取并输出动态内容
        getArticleInfo: true, //是否获取并输出专栏信息
        getLiveRoomInfo: true, //是否获取并输出直播间信息
    },
};
// User-Agent 模拟浏览器
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
// 模拟 Cookie 这里实际使用时请替换为自己的 Cookie 
const COOKIE = "buvid3=51B3F03E-B2A3-6328-6A96-AAFFBE31585856233infoc; b_nut=1724515656; b_lsid=FC7E3D710_1918524A5D0; _uuid=3865BE2D-F4F3-E193-8BA9-A59CC89248FC57181infoc; buvid_fp=247a193ce4cb33454249d3fa0c07b5b1; buvid4=B9A20CE9-F21B-9CBB-C9A2-2BF87A4818F459449-024082416-HVDOzGeW%2BZDZz6AcFkXlwYVKj0krf8ZoxBG%2F5iBAGG5cfpYa1XGKbK%2FTuBwh%2BuYj; enable_web_push=DISABLE; home_feed_column=5; browser_resolution=1920-957";
/**
 * 净化链接
 * @param link b站链接
 */
const purgeLink = (link) => {
    try {
        const url = new URL(link);
        if (url.hostname === "live.bilibili.com") {
            url.search = "";
            url.hash = "";
            return url.href;
        }
        url.searchParams.delete("spm_id_from");
        return url.href;
    }
    catch (_error) { }
    return link;
};
/**
 * 净化文本中的链接
 * @param text b站链接
 */
const purgeLinkInText = (text) => text.replace(/https?:\/\/[-\w~!@#$%&*()+=;':,.?/]+/g, (url) => purgeLink(url));
/**
 * 数字取万
 * @param num 数字
 */
const humanNum = (num) => num < 10000 ? num : `${(num / 10000).toFixed(1)}万`;
//视频信息
const getVideoInfo = async (params, logger) => {
    try {
        const response = await axios.get(`https://api.bilibili.com/x/web-interface/view`, {
            params,
            timeout: 10000,
            headers: {
                "User-Agent": USER_AGENT,
                Cookie: COOKIE,
            },
        });
        const { code, message, data } = response.data;
        if (code === -404)
            return [segment.text("该视频已被删除")];
        if (code !== 0)
            return [segment.text(`Error: (${code})${message}`)];
        const { bvid, aid, pic, title, owner: { name }, stat: { view, danmaku, like, coin, favorite }, } = data;
        //like 点赞 coin 投币 favorite 收藏
        return [
            segment.image(pic),
            segment.text([
                // `av${aid}`, //av号没啥用了
                title,
                `UP: ${name}`,
                `${humanNum(view)}播放 ${humanNum(danmaku)}弹幕`,
                `点赞: ${humanNum(like)}  投币: ${humanNum(coin)}  收藏: ${humanNum(favorite)}`,
                `https://www.bilibili.com/video/${bvid}`,
            ].join("\n")),
        ];
    }
    catch (error) {
        logger.error(`B站视频信息获取失败`);
        logger.error(params);
        logger.error(error);
        return [segment.text("视频信息获取失败~")];
    }
};
//直播信息
const getLiveRoomInfo = async (id, logger) => {
    try {
        const response = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${id}`, {
            timeout: 10000,
            headers: {
                "User-Agent": USER_AGENT,
                Cookie: COOKIE,
            },
        });
        const { code, message, data } = response.data;
        if (code !== 0)
            return [segment.text(`Error: (${code})${message}`)];
        const { room_info: { room_id, short_id, title, live_status, area_name, parent_area_name, keyframe, online, }, anchor_info: { base_info: { uname }, }, } = data;
        return [
            segment.image(keyframe),
            segment.text([
                title,
                `主播: ${uname}`,
                `房间号: ${room_id}${short_id ? `  短号: ${short_id}` : ""}`,
                `分区: ${parent_area_name}${parent_area_name === area_name ? "" : `-${area_name}`}`,
                live_status ? `直播中  ${humanNum(online)}人气` : "未开播",
                `https://live.bilibili.com/${short_id || room_id}`,
            ].join("\n")),
        ];
    }
    catch (error) {
        logger.error(`B站直播信息获取失败`);
        logger.error({ id });
        logger.error(error);
        return [segment.text("直播信息获取失败~")];
    }
};
//专栏信息
const getArticleInfo = async (id, logger) => {
    try {
        const response = await axios.get(`https://api.bilibili.com/x/article/viewinfo?id=${id}`, {
            timeout: 10000,
            headers: {
                "User-Agent": USER_AGENT,
                Cookie: COOKIE,
            },
        });
        const { code, message, data } = response.data;
        if (code !== 0)
            return [segment.text(`Error: (${code})${message}`)];
        const { stats: { view, reply }, title, author_name, origin_image_urls: [img], } = data;
        return [
            segment.image(img),
            segment.text([
                title,
                `UP: ${author_name}`,
                `${humanNum(view)}阅读 ${humanNum(reply)}评论`,
                `https://www.bilibili.com/read/cv${id}`,
            ].join("\n")),
        ];
    }
    catch (error) {
        logger.error(`B站文章信息获取失败`);
        logger.error({ id });
        logger.error(error);
        return [segment.text("文章信息获取失败~")];
    }
};
//动态信息
const getDynamicInfo = async (id, logger) => {
    try {
        const response = await axios.get("https://api.bilibili.com/x/polymer/web-dynamic/v1/detail", {
            timeout: 10000,
            params: {
                timezone_offset: new Date().getTimezoneOffset(),
                id,
                features: "itemOpusStyle",
            },
            headers: {
                "User-Agent": USER_AGENT,
                Cookie: COOKIE,
            },
        });
        const { code, message, data } = response.data;
        if (code === 4101131 || code === 4101105)
            return [segment.text("动态不存在")];
        if (code !== 0)
            return [segment.text(`Error: (${code})${message}`)];
        if (!data?.item)
            return [segment.text("Error: 无内容")];
        return await formatDynamic(data.item);
    }
    catch (error) {
        logger.error(`B站动态信息获取失败`);
        logger.error({ id });
        logger.error(error);
        return [segment.text("动态信息获取失败~")];
    }
};
const additionalFormatters = {
    // 投票
    ADDITIONAL_TYPE_VOTE: ({ vote: { desc, end_time, join_num }, }) => [
        segment.text([
            `【投票】${desc}`,
            `截止日期：${new Date(end_time * 1000).toLocaleString()}`,
            `参与人数：${humanNum(join_num)}`,
            "投票详情见原动态",
        ].join("\n")),
    ],
    // 预约
    ADDITIONAL_TYPE_RESERVE: ({ reserve: { title, desc1, desc2 }, }) => {
        const lines = [title];
        const desc = [desc1?.text, desc2?.text].filter((v) => v);
        if (desc.length > 0)
            lines.push(desc.join("  "));
        return [segment.text(lines.join("\n"))];
    },
};
const majorFormatters = {
    // 图片
    MAJOR_TYPE_DRAW: ({ draw: { items } }) => items.map(({ src }) => segment.image(src)),
    // 视频
    MAJOR_TYPE_ARCHIVE: ({ archive: { cover, aid, bvid, title, stat }, }) => [
        segment.image(cover),
        segment.text([
            `av${aid}`,
            title?.trim(),
            `${stat.play}播放 ${stat.danmaku}弹幕`,
            `https://www.bilibili.com/video/${bvid}`,
        ].join("\n")),
    ],
    // 文章
    MAJOR_TYPE_ARTICLE: ({ article: { covers, id, title, desc }, }) => [
        ...(covers.length ? [segment.image(covers[0])] : []),
        segment.text([
            `《${title?.trim()}》`,
            desc?.trim(),
            `https://www.bilibili.com/read/cv${id}`,
        ].join("\n")),
    ],
    // 音乐
    MAJOR_TYPE_MUSIC: ({ music: { cover, id, title, label }, }) => [
        segment.image(cover),
        segment.text([
            `au${id}`,
            title?.trim(),
            `分类：${label}`,
            `https://www.bilibili.com/audio/au${id}`,
        ].join("\n")),
    ],
    // 直播
    MAJOR_TYPE_LIVE: ({ live: { cover, title, id, live_state, desc_first, desc_second }, }) => [
        segment.image(cover),
        segment.text([
            title,
            `房间号：${id}`,
            `分区：${desc_first}`,
            live_state ? `直播中  ${desc_second}` : "未开播",
            `https://live.bilibili.com/${id}`,
        ].join("\n")),
    ],
    MAJOR_TYPE_LIVE_RCMD: ({ live_rcmd: { content }, }) => {
        const { live_play_info: { cover, title, room_id, live_status, parent_area_name, area_name, watched_show: { text_large }, }, } = JSON.parse(content);
        return [
            segment.image(cover),
            segment.text([
                title,
                `房间号：${room_id}`,
                `分区：${parent_area_name}・${area_name ? `${area_name}` : ""}`,
                live_status ? `直播中  ${text_large}` : "未开播",
                `https://live.bilibili.com/${room_id}`,
            ].join("\n")),
        ];
    },
    // 通用动态？
    MAJOR_TYPE_OPUS: async ({ opus, }) => {
        const { pics, summary: { text }, title, } = opus;
        const lines = [];
        if (title)
            lines.push(segment.text(`《${title.trim()}》\n`));
        if (text)
            lines.push(segment.text(`${text.trim()}\n`));
        if (pics.length)
            lines.push(...pics.map(({ url }) => segment.image(url)));
        return lines;
    },
};
const formatDynamic = async (item) => {
    const { module_author: author, module_dynamic: dynamic } = item.modules;
    const lines = [
        segment.text([`https://t.bilibili.com/${item.id_str}`, `UP: ${author.name}`].join("\n")),
    ];
    const desc = dynamic?.desc?.text?.trim();
    if (desc)
        lines.push(segment.text(purgeLinkInText(desc)));
    const major = dynamic?.major;
    if (major && major.type in majorFormatters) {
        const formatter = majorFormatters[major.type];
        lines.push(...(await formatter(major)));
    }
    const additional = dynamic?.additional;
    if (additional && additional.type in additionalFormatters) {
        const formatter = additionalFormatters[additional.type];
        lines.push(...(await formatter(additional)));
    }
    if (item.type === "DYNAMIC_TYPE_FORWARD") {
        if (item.orig.type === "DYNAMIC_TYPE_NONE") {
            lines.push(segment.text("【转发的源动态已被作者删除】"));
        }
        else {
            lines.push(...(await formatDynamic(item.orig)));
        }
    }
    return lines;
};
const reg = new RegExp(/(((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+)|(bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+)))|(t\.bilibili\.com\/(\d+))|(m\.bilibili\.com\/dynamic\/(\d+))|(www\.bilibili\.com\/opus\/(\d+))|(bilibili\.com\/read\/(?:cv|mobile\/)(\d+))|(live\.bilibili\.com\/blanc\/(\d+))|com\.tencent\.miniapp_01/gi);
export const bilibili = karin.command(reg, async (e) => {
    const firstMessage = e.elements[0];
    let url;
    let isMiniProgram = false;
    if (firstMessage.type === "text") {
        url = firstMessage.text;
    }
    else if (firstMessage.type === "json") {
        const data = JSON.parse(firstMessage.data);
        url = data?.meta?.detail_1?.qqdocurl || data?.meta?.news?.jumpUrl;
        isMiniProgram = firstMessage.data.includes("com.tencent.miniapp_01");
    }
    if (!url)
        return false;
    const param = await getIdFromMsg(url);
    const { avid, bvid, dyid, arid, lrid } = param;
    if (!avid && !bvid && !arid && !dyid && !lrid)
        return false;
    if (isMiniProgram) {
        if (e.subEvent === "group" && _config.recallMiniProgram) {
            const userInfo = await e.bot.getGroupMemberInfo(e.groupId, e.bot.selfId);
            if (userInfo.role === "owner" ||
                (userInfo.role === "admin" && e.sender.role === "member")) {
                await e.bot.recallMsg(e.contact, e.messageId);
            }
        }
    }
    if (_config.getInfo.getVideoInfo && (avid || bvid)) {
        const res = await getVideoInfo({ aid: avid, bvid }, logger);
        karin.sendMsg(e.bot.selfId, e.contact, res);
        return false;
    }
    if (_config.getInfo.getLiveRoomInfo && lrid) {
        const res = await getLiveRoomInfo(lrid, logger);
        karin.sendMsg(e.bot.selfId, e.contact, res);
        return false;
    }
    if (_config.getInfo.getArticleInfo && arid) {
        const res = await getArticleInfo(arid, logger);
        karin.sendMsg(e.bot.selfId, e.contact, res);
        return false;
    }
    if (_config.getInfo.getDynamicInfo && dyid) {
        const res = await getDynamicInfo(dyid, logger);
        karin.sendMsg(e.bot.selfId, e.contact, res);
        return false;
    }
    return false;
});
const getIdFromMsg = async (msg) => {
    const match = /((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+/.exec(msg);
    if (match)
        return getIdFromShortLink(`https://${match[0]}`);
    return getIdFromNormalLink(msg);
};
const getIdFromNormalLink = (link) => {
    const searchVideo = /bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) || [];
    const searchDynamic = /t\.bilibili\.com\/(\d+)/i.exec(link) ||
        /m\.bilibili\.com\/dynamic\/(\d+)/i.exec(link) ||
        /www\.bilibili\.com\/opus\/(\d+)/i.exec(link) ||
        [];
    const searchArticle = /bilibili\.com\/read\/(?:cv|mobile\/)(\d+)/i.exec(link) || [];
    const searchLiveRoom = /live\.bilibili\.com\/blanc\/(\d+)/i.exec(link) || [];
    return {
        avid: searchVideo[1],
        bvid: searchVideo[2],
        dyid: searchDynamic[1],
        arid: searchArticle[1],
        lrid: searchLiveRoom[1],
    };
};
const getIdFromShortLink = async (shortLink) => {
    return await axios
        .head(shortLink, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
    })
        .then((ret) => getIdFromNormalLink(ret.headers.location))
        .catch((error) => {
        logger.error(`B站短链转换失败 ${shortLink}`);
        logger.error(error);
        return {
            avid: undefined,
            bvid: undefined,
            dyid: undefined,
            arid: undefined,
            lrid: undefined,
        };
    });
};
