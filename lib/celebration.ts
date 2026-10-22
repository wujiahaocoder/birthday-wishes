import { z } from "zod";

export const presets = {
  gentle: { label: "温柔治愈", text: "愿你每一个平凡的日常，都能遇见一点小小的惊喜。愿你有说走就走的勇气，也有随时可以回去的港湾。\n\n新的一岁，不必成为别人眼中厉害的大人。慢慢来，去做喜欢的事，去见想念的人，去成为更自在的自己。\n\n你值得所有认真准备的浪漫，也值得每一句发自内心的喜欢。生日快乐，今天的偏爱，全都给你。" },
  friend: { label: "挚友专属", text: "又陪你解锁了人生的新一岁！谢谢你一直都在，陪我分享那些大惊小怪，也接住生活里的奇奇怪怪。\n\n愿你新的一岁，快乐不需要理由，好运不需要排队。想吃的永远吃不胖，想做的都能慢慢做到。\n\n未来还有好多顿饭、好多场日落、好多句「走啊」等着我们。生日快乐，我的最佳拍档！" },
  love: { label: "浪漫告白", text: "世界很大，能遇见你，是我最想珍藏的小幸运。与你有关的每一个普通日子，都被悄悄加上了糖。\n\n今天想把最柔软的祝福送给你：愿你眼里总有光，身边总有爱，所有期待都能一点点成为现实。\n\n新的一岁，我想继续陪你看四季流转，把日子过成我们喜欢的模样。生日快乐，我最偏爱的人。" },
  bright: { label: "元气满满", text: "叮！新一岁的人生体验卡已到账，请签收这份超级加倍的快乐！\n\n愿你有做梦的底气，也有出发的勇气。生活偶尔下雨也没关系，你可以自己带着太阳。\n\n把烦恼调成静音，把快乐调到最大。新的一岁，继续热气腾腾，继续闪闪发光，继续做那个独一无二的你！" },
};
export const configSchema = z.object({
  name: z.string().trim().min(1, "请写下寿星的名字").max(20, "名字最多 20 个字"),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请选择完整的生日日期").refine((v) => {
    const date = new Date(v + "T12:00:00Z");
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v && +v.slice(0, 4) >= 1900 && +v.slice(0, 4) <= 2200;
  }, "请输入有效的生日日期"),
  age: z.number().int().min(1).max(120).nullable(),
  sender: z.string().trim().min(1, "请留下你的署名").max(30, "署名最多 30 个字"),
  blessing: z.string().trim().min(1, "写一点想对 TA 说的话吧").max(1200, "寄语最多 1200 个字"),
  theme: z.enum(["cherry", "matcha", "berry"]),
}).strict();
export const messageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "请留下你的称呼").max(20, "称呼最多 20 个字"),
  content: z.string().trim().min(1, "先写下一点心意吧").max(300, "留言最多 300 个字"),
  kind: z.enum(["message", "wish"]), color: z.enum(["peach", "sage", "butter", "lavender"]),
  website: z.string().max(0).optional(),
}).strict();
export type CelebrationConfig = z.infer<typeof configSchema>;
export type Celebration = CelebrationConfig & { id: string };
export type Message = { id: string; name: string; content: string; kind: "message" | "wish"; color: "peach" | "sage" | "butter" | "lavender"; createdAt: string };
export const defaultCelebration: Celebration = {
  id: "demo", name: "小满", birthday: "2026-10-22", age: null,
  sender: "爱你的朋友", blessing: presets.gentle.text, theme: "cherry",
};
export const builtInMessages: Message[] = [
  { id: "builtin-1", name: "今日偏爱", content: "愿你被这个世界温柔以待，也永远有勇气做自己。生日快乐，今天请比昨天更开心一点。", kind: "message", color: "butter", createdAt: "" },
  { id: "builtin-2", name: "今日偏爱", content: "新的一岁，愿生活里有热汤和甜食，身边有爱与陪伴，心里有诗和远方。", kind: "message", color: "sage", createdAt: "" },
  { id: "builtin-3", name: "今日偏爱", content: "把烦恼吹进蜡烛里，把期待写进明天里。愿每一个小小的愿望，都有慢慢实现的那一天。", kind: "wish", color: "peach", createdAt: "" },
];
