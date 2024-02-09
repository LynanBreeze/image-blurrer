突发奇想会不会某一天因为微信账号被封导致我失去我的联系人带来不方便，今天备份了一次微信通讯录，当账号丢失时我还可以通过我的备份文件找到我的联系人。

## 如何运行
1. clone this repo
2. `yarn && yarn dev`

## 备份步骤

1. 使用 iTunes 也就是现在内置在 Finder 里面的 Device 里面了，**不加密**备份一次
   备份时间取决于你的设备数据大小，我的 iPhone 14 Pro 256GB 使用了 149GB，备份耗时 35 分钟。
2. 使用 [iPhone Backup Extractor](https://www.iphonebackupextractor.com/) 的 Expert Mode 提取<mark>Applications/com.tencent.xin/Documents/[MD5 of Your Wechat ID]/DB/WCDB_Contact.sqlite</mark>文件
   ![](https://article-assets.lynan.cn/imgs/Jietu20231130-102809_1701311336403.jpg)
3. 使用 [DB Browser for SQLite](https://sqlitebrowser.org/) 打开刚刚 Extract 出来的 `WCDB_Contact.sqlite` 文件，选择 <mark>Friend</mark> 表，菜单栏中选择 <mark>File/Export/Table(s) as CSV File...</mark>

### 为什么导出 CSV？

请看我直接用 [DB Browser for SQLite](https://sqlitebrowser.org/) 打开看到的内容，很多字段是 BLOB 二进制类型，特别不直观，对于我们需要阅读和查找都非常不方便。

![](https://article-assets.lynan.cn/imgs/Jietu20231129-144621_1701240435700.jpg?imageMogr2/format/webp)

特别是 `dbContactRemark` 字段，里面的格式很奇怪，包含 n 个 uniCode 字符 + 昵称 + 修改过的微信 id + 备注 + 拼音 等等

## 解析、查询.CSV 内的数据

[✈️ 直达：](https://lynan.cn/static/wechat-contact-parser/)

为了方便查找，表格中我只列出了 4 列数据，分别是头像（`dbContactHeadImage`）、微信 id（`userName`）、微信名称（`dbContactRemark`）、备注（`dbContactRemark`）。
搜索框输入关键词时从 `userName` 和 `dbContactRemark` 字段中寻找匹配。

完全本地解析，放心食用。

![](https://article-assets.lynan.cn/imgs/wechat-contact-parser1_1701264027197.jpg?imageMogr2/format/webp)
![](https://article-assets.lynan.cn/imgs/wechat-contact-parser2_1701264076160.jpg?imageMogr2/format/webp)

## Friend 表里的 type 字段枚举值参考

| type       | meaning                                     |
| ---------- | ------------------------------------------- |
| 0          | 微信收款助手、小程序商家助手、WeChat Pay HK |
| 1          | 公众号、朋友圈、好友                        |
| 2          | 微信群（不是我创建的）、附近的人、摇一摇    |
| 3          | 好友                                        |
| 4          | 在同一个群里但不是好友                      |
| 5          | 朋友发的名片加的好友                        |
| 7          | 从微信群加的好友                            |
| 8          | 黑名单                                      |
| 33         | QQ 邮箱提醒                                 |
| 259        | 不给他看朋友圈                              |
| 263        | 不给他看朋友圈                              |
| 515        | 公众号                                      |
| 2049       | 文件传输助手                                |
| 2050       | 我创建的微信群                              |
| 65537      | 不看他的朋友圈                              |
| 65539      | 不看他的朋友圈                              |
| 65543      | 不看他的朋友圈                              |
| 65795      | 不看他的朋友圈                              |
| 66051      | 不看他的朋友圈                              |
| 73729      | 不看他的朋友圈                              |
| 98307      | 不看他的朋友圈                              |
| 98311      | 不看他的朋友圈                              |
| 8388611    | 仅聊天                                      |
| 8388615    | 仅聊天                                      |
| 8388867    | 仅聊天                                      |
| 8421379    | 仅聊天                                      |
| 8421635    | 仅聊天                                      |
| 268435458  | 微信群                                      |
| 2147483649 | 公众号                                      |
| 2147483651 | 公众号                                      |

## 参考文章

- [数据备份系列（一）：微信通讯录备份](https://pwfee.com/2020/03/back-up-wechat-contacts)
