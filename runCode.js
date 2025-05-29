/**
 * @file 运行JavaScript代码
 * @author jacksixth
 * @license GPL-3.0-only
 * @description 运行JavaScript代码
 * @example #rjs return 10 + 20
 */
import karin, { logger } from "node-karin";
import * as vm from "vm";
export const runJS = karin.command("^#?rjs (.+)", async (e) => {
    const input = e.msg.replace(/^#?rjs\s+/, "").trim();
    if (!input)
        return e.reply("请提供要运行的 JavaScript 代码");
    // 解析参数（支持 --timeout=xxx）
    let timeout = 20000; // 默认 20s
    let code = input;
    const timeoutMatch = input.match(/--timeout=(\d+)/i);
    if (timeoutMatch) {
        const ms = parseInt(timeoutMatch[1], 10);
        if (ms > 0) {
            timeout = ms;
            code = input.replace(timeoutMatch[0], "").trim();
        }
    }
    const context = {
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        karin,
        logger,
        e,
    };
    const sandbox = vm.createContext(context);
    const script = new vm.Script(`(async () => { ${code} })()`);
    try {
        const result = await script.runInContext(sandbox, { timeout });
        if (result === "")
            return e.reply("没有返回值");
        const msg = typeof result === "object" && result !== null
            ? JSON.stringify(result, null, 2)
            : String(result);
        return e.reply(msg, { reply: true });
    }
    catch (error) {
        if (String(error) === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
            logger.error("代码执行超时");
            e.reply("代码执行超时，请检查逻辑是否死循环或过于复杂。");
        }
        else {
            logger.error("运行JavaScript代码时出错:", error);
            e.reply(`运行代码时出错: \n ${String(error)}`);
        }
    }
});
