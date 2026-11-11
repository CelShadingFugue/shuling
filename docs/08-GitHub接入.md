# 08 · 接入 GitHub（SSH）

> 现状（2026-11-11 检查）：
> - 本机已有密钥 `~/.ssh/id_ed25519`，公钥在下面第 1 步。
> - **这把钥匙还没加到 GitHub**，`ssh -T git@github.com` 返回 `Permission denied (publickey)`。
> - 本机没装 `gh` 命令行，所以建仓库用网页。

---

## 1. 把公钥加到 GitHub

你机器上的公钥（整行复制，别断行）：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEkzPSpjf0tzafgqxczI8+DF5Q3AkXkBU/kLXrf/bm4J fq@DESKTOP-52OR4FT
```

1. 打开 <https://github.com/settings/keys>
2. **New SSH key** → Title 随便写（比如 `宿舍台式机`）→ Key 粘贴上面那一整行 → **Add SSH key**
3. 回终端验证：

```bash
ssh -T git@github.com
```

看到 `Hi <你的用户名>! You've successfully authenticated...` 就成了。

> 这把钥匙同时也在连树莓派（`~/.ssh/config` 里的 `rpi` / `rpi-ts`），可以共用，不用另生成。

---

## 2. 建仓库

网页操作：<https://github.com/new>

| 项 | 建议值 |
|---|---|
| Repository name | `shuling`（或 `ourApp`） |
| 可见性 | **Private**（里面有申请表、学号、联系方式） |
| 初始化 | **什么都不要勾**（不要 README / .gitignore / license） |

建完它会给你一个地址，形如：

```
git@github.com:<你的用户名>/shuling.git
```

---

## 3. 连上并推

仓库本地已经提交好了，只差一个远端。把 `<你的用户名>` 和仓库名换成你的：

```bash
# 分支统一叫 main（GitHub 的默认）
git branch -M main

# 加远端
git remote add origin git@github.com:<你的用户名>/shuling.git

# 第一次推
git push -u origin main
```

之后每次就是：

```bash
git add -A
git commit -m "说明你改了什么"
git push
```

---

## 4. 别人怎么拿到

把仓库地址发给另外三个人，他们：

```bash
git clone git@github.com:<你的用户名>/shuling.git
```

然后读 `users/<他们的名字>/工作指南.md`。

如果要给别人开通推送权限：**Settings → Collaborators → Add people**。
只想让他们看：仓库保持 Private，把链接发给他们并单独授权；或者公开仓库、只让自己 push。

---

## 5. 常见问题

**`Permission denied (publickey)`**
钥匙没加到 GitHub，或者加错了账号。回去做第 1 步，用 `ssh -T git@github.com` 验证。

**`Host key verification failed`**
第一次连 GitHub 会问 `Are you sure you want to continue connecting?`，输 `yes`。
不想被问就 `ssh-keyscan github.com >> ~/.ssh/known_hosts`。

**推上去发现有大文件 / 密钥**
```bash
git rm --cached <文件>
echo "<文件>" >> .gitignore
git commit -m "移除误提交的文件"
```

**`src refspec main does not match any`**
本地还没有 `main` 分支，先 `git branch -M main`（把当前的 master 改名）。

**想换一把钥匙**
```bash
ssh-keygen -t ed25519 -C "your@email" -f ~/.ssh/id_ed25519_github
```
然后在 `~/.ssh/config` 里加：

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes
```

---

## 6. 仓库里放了什么（推之前确认一遍）

- ✅ 源码、文档、`dist/ourApp.html`、`data/board.json`
- ❌ `node_modules/`（已在 `.gitignore`）
- ⚠️ `卓越班科创活动项目申请表(2).docx` 里有学号和手机号 —— **如果仓库要公开，先把它挪出去或删掉**。
