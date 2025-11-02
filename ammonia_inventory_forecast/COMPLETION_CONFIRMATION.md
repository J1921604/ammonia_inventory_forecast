
### デプロイ
修正内容をGitHubにプッシュすると、自動的にデプロイされます:

```bash
git add .
git commit -m "fix: 基準日の赤い縦線を基準日と連動、ラベル赤字表示、基準日テキスト追加"
git push origin main
```

GitHub Actionsが自動的にビルド＆デプロイを実行します。

---
