# 08 · 接入 GitHub（SSH）

> **状态：已接通**（2026-11-11）
> - 仓库：<https://github.com/CelShadingFugue/shuling>（Private）
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

- **只想让他们看**：保持 Private，在 **Settings → Collaborators** 里邀请，给 Read 权限
- **要能推送**：同上，给 Write 权限
- **要公开**：Settings → 最下面 Danger Zone → Change visibility。
  ⚠️ 公开前必须清掉历史里的个人信息（见第 6 节）

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
```bash
git rm --cached <文件>
echo "<文件>" >> .gitignore
git commit -m "移除误提交的文件"
```

---

## 6. 关于历史里的那份申请表

`卓越班科创活动项目申请表(2).docx`（含学号、手机号）在**前两个提交**里出现过，第 3 个提交把它移出了工作区，所以**当前文件树是干净的，但历史里还有**。

Private 仓库无所谓。**一旦要转公开**，先做一次历史清理：

```bash
# 需要 git-filter-repo（pip install git-filter-repo）
git filter-repo --path "卓越班科创活动项目申请表(2).docx" --invert-paths
git push --force
```

或者更彻底：新建一个空仓库，只推当前快照（丢历史，最干净）。
