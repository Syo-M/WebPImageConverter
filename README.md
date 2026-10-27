# こかる — WebP画像変換

HTML / CSS / JavaScriptのみで動作する静的な画像変換サイトです。ビルド・APIキー・バックエンドは不要です。画像の読み込み、変換、ZIP作成はブラウザ内で完結し、画像を外部に送信しません。外部フォント・解析タグ・外部JavaScriptライブラリ・実行時CDNへの依存もありません。

## 起動

このフォルダで次を実行し、http://localhost:4173 を開きます。

```sh
python3 -m http.server 4173
```

## 機能

- JPEG / PNG / GIF / WebP / BMP / AVIF を混在させて追加
- ドラッグ＆ドロップ、複数ファイル選択（スマートフォン対応）
- `canvas.toBlob()` によるWebP変換、10〜100%の画質指定
- 縦横比を保つ縮小、透明背景の保持または白背景への合成
- サムネイル、出力サイズ、変換前後の容量、削減率の表示
- 画像ごとのダウンロード、変換済み画像をまとめたZIPのダウンロード
- 同名ファイルは `image (2).webp` のように連番化（ZIPでも上書きしません）
- 壊れた画像などは行ごとにエラーを表示し、残りの画像は変換を続行
- 設定変更時に結果を破棄して再変換、個別削除、一括削除

追加後は「WebPに変換」を押します。変換中に追加した画像は次回の変換対象になります。ZIPには変換に成功した画像だけが入ります。

## 仕様・制限

- 最新のChrome / Edge / Firefox / Safariなど、WebP書き出しに対応するブラウザが必要です。実際の出力MIMEタイプを検査し、未対応ならエラーを表示します。
- GIF・アニメーション画像は先頭の1フレームを静止画に変換します。ImageBitmapが使えない古い環境ではネイティブ画像デコードにフォールバックし、表示時点のフレームが使われる場合があります。
- 画像の読み込みはブラウザ標準の機能を使用します。形式ごとの読み込み対応はブラウザによって異なります。HEIC・HEIFは非対応のため、JPEGやPNGに書き出してから追加してください。
- 画質は非可逆圧縮の指定値で、必ず小さくなる保証はありません。大きくなった場合も明示します。EXIFなどのメタデータは保持しません。
- 上限：1ファイル50MB、一覧100枚、入力合計500MB、元画像4,000万画素、ZIP内の出力合計500MB。端末のメモリにより、それ以下でも処理できない場合があります。
- 画像は1枚ずつ処理します。ブラウザのタブを閉じると作業結果は失われます。
- ZIPは圧縮済みのWebPをSTORE方式で格納します。日本語のファイル名に対応します。ZIP64には対応しません。

## GitHub Pagesで公開する

1. GitHubでリポジトリを作成し、このフォルダのファイルをアップロードします。`.gitignore` の対象となる制作・検証用ファイルは除外します。
2. リポジトリの **Settings → Pages** を開きます。
3. **Build and deployment → Source** で **Deploy from a branch** を選択します。
4. **Branch** に `main`、フォルダに `/ (root)` を指定して保存します。
5. デプロイ後に表示されるURLを開きます。

相対パスを使用しているため、`https://ユーザー名.github.io/リポジトリ名/` 配下で動きます。`.nojekyll` によりJekyllによる処理を無効にしています。公開先に合わせてリポジトリ名を固定する必要はありません。

## ファイル

| ファイル | 役割 |
| --- | --- |
| `index.html` | サイト構造・UI |
| `styles.css` | レスポンシブな独自デザイン |
| `app.js` | ファイル管理、画像変換、保存 |
| `zip.js` | UTF-8対応ZIP作成・CRC-32 |
| `assets/favicon.svg` | サイトアイコン |
| `privacy.html` | 日英のプライバシーポリシー |
| `terms.html` | 日英の利用条件 |
| `licenses.html` / `LICENSE` | サービス利用とコード再利用の権利表示 |
| `legal.css` | ポリシーページのデザイン |

## 検証

```sh
node --check app.js
node --check zip.js
node --test tests/zip.test.cjs
```

ZIPのCRC・日本語名・内容はNode.jsテストとPython標準ライブラリで検証できます。ブラウザでの画像形式ごとの変換や保存はローカルプレビューで確認してください。

画像変換とZIP作成はブラウザ標準APIおよび独自コードで実装しており、第三者のJavaScriptライブラリは同梱していません。


## ポリシー・ライセンス

運営者名は `syo motoyama`、公開連絡先は `syoeureka@gmail.com` として、日英のポリシーページを用意しています。メールアドレスはサイト上に公開されます。問い合わせへの連絡手段であり、画像送信は変換機能に必要ありません。

- `privacy.html`：端末内処理、永続保存なし、広告・解析なし、GitHub PagesのIP記録、Gmailへの問い合わせと保管、利用者の権利。
- `terms.html`：無料の個人・業務利用、画像の権利、変換の制限、法令上認められる範囲での保証・責任の説明。
- `licenses.html` / `LICENSE`：第三者ライブラリの同梱なし。サイトの利用許可とソースコードの再配布許可を区別しています。MIT等のOSSライセンスは新たに付与していません。

これらのページと `LICENSE` は公開・追跡対象です。連絡先や配信元を変更した場合、広告・解析・フォーム・画像送信・新しい依存ライブラリを追加した場合は、実際の取り扱いに合わせて各ページを更新してください。制定・最終更新日は2026年10月27日です。これらの文書は、すべての法域への適合を保証するものではありません。

記載内容の確認に用いた公式資料：
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection
- https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
- https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/
- https://policies.google.com/privacy
- https://choosealicense.com/no-permission/
