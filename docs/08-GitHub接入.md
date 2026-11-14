# 08 · 接入 GitHub（SSH）

> **状态：已接通 · 公开仓库**（2026-11-11 接通，2026-11-14 转 Public 并清理历史）
> - 仓库：<https://github.com/CelShadingFugue/shuling>（**Public**）
> - 本机密钥 `~/.ssh/id_ed25519` 已加到 GitHub，`ssh -T git@github.com` 返回 `Hi CelShadingFugue!`
> - 远端 `origin` 已配好，分支 `main` 已推送
>
> 下面留给**其他人**第一次配置时看。

---

## 1. 把公钥加到 GitHub

本机已有密钥 `~/.ssh/id_ed25519`（它同时在连树莓派，可以共用，不用另生成）。

查自己的公钥：

```bash
cat ~/.ssh/id_ed25519.pub
```

1. 打开 <https://github.com/settings/keys>
2. **New SSH key** → Title 随便写（比如 `宿舍台式机`）→ Key 粘贴上面那一整行 → **Add SSH key**
3. 验证：

```bash
ssh -T git@github.com
```

看到 `Hi <你的用户名>! You've successfully authenticated...` 就成了。

> 没有密钥的话先 `ssh-keygen -t ed25519 -C "你的邮箱"`，一路回车。

---

## 2. 克隆仓库

```bash
git clone git@github.com:CelShadingFugue/shuling.git
cd shuling
```

然后读 `users/<你的名字>/工作指南.md`。

---

## 3. 日常提交

```bash
git pull                 # 先拉，别在旧版本上改
git add -A
git commit -m "说明你改了什么"
git push
```

只改自己的文件夹时基本不会冲突；真冲突了，先别硬来，把两边都留着问一声。

---

## 4. 给别人权限

仓库是 **Public**，谁都能看，不用邀请。

- **只想让他们看**：把链接发过去就行
- **要能推送**：**Settings → Collaborators** 里邀请，给 Write 权限
- **想改回 Private**：Settings → 最下面 Danger Zone → Change visibility

---

## 5. 常见问题

**`Permission denied (publickey)`**
钥匙没加到 GitHub，或加到了别的账号。用 `ssh -T git@github.com` 验证。

**`Host key verification failed`**
第一次连会问 `Are you sure you want to continue connecting?`，输 `yes`。
或者 `ssh-keyscan github.com >> ~/.ssh/known_hosts`。

**`src refspec main does not match any`**
本地还没有 `main`，先 `git branch -M main`。

**推上去发现有大文件 / 密钥**

文件里没有个人信息：`git rm --cached <文件>`，再写进 `.gitignore`，提交一次就行。

**带学号 / 手机号 / 密钥：删文件没用**，历史里还留着，必须按第 6 节重写历史。

---

## 6. 仓库是公开的：什么能进、什么不能进

**现在是 Public**。任何人打开链接都能看到全部文件和**全部历史**，不用登录。

2026-11-14 做过一次历史清理：`卓越班科创活动项目申请表(2).docx`（含 4 个人的学号、手机号）原本在最初的提交里，已经从**全部 19 个提交**中删除并强制推送。当前远端历史是干净的。

**永久不要提交**：

| 不要进仓库 | 为什么 |
|---|---|
| 申请表、名单、报名表（学号 / 手机号 / 身份证） | 删掉文件，历史里还在 |
| 密码、API key、`.env` | 公开仓库等于公开发布 |
| 证件照、成绩单、家庭信息 | 同上 |

**万一又提交了**：别只删文件了事，历史里还是能翻出来。要重写历史：

```bash
# 需要 git-filter-repo（pip install git-filter-repo）
git filter-repo --path "<文件路径>" --invert-paths
git push --force
```

或者更彻底：新建一个空仓库，只推当前快照（丢历史，最干净）。

**队友注意**：2026-11-14 的强制推送**重写了所有提交的编号**。**在这之前克隆过的仓库必须删掉重新 clone**——在旧克隆上继续 pull/push 会把旧历史带回来，等于白清。
