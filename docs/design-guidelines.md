# MotherMap 管理画面 — デザイン／CSS ガイドライン

このドキュメントは、`assets/css/styles.css` と各 HTML で共有している**配色トークン**、**クラス命名の考え方**、**CSS の指定ルール**をまとめたものです。新規コンポーネントやページを足すときの参照用にしてください。

---

## 1. ファイル構成（参照）

| 種別 | パス |
|------|------|
| スタイルシート | `assets/css/styles.css` |
| エントリ HTML | `index.html`（ルート） |
| その他ページ | `admin-pages/*.html`（例: `page-index.html`, `form-basic.html`, `list-basic.html`, `detail-basic.html`, `component.html` ほか） |
| スクリプト | `assets/js/app.js` |

HTML から CSS は相対パスで読み込みます（ルート: `assets/css/styles.css`、`admin-pages/`: `../assets/css/styles.css`）。

---

## 2. 配色（CSS 変数）

`:root` で定義したトークンを使います。**本文・背景・枠線は必ず変数経由**にし、16 進を直書きしないことを推奨します（アニメーションや極端な半透明などの例外を除く）。

### 2.1 ベースカラー

| 変数 | 用途の目安 |
|------|------------|
| `--color-bg` | ページ背景 |
| `--color-surface` | カード・パネル・入力の面 |
| `--color-surface-soft` | 薄い面・ホバー下地 |
| `--color-panel` | パネル（現状 surface と同系） |
| `--color-border` | 通常の枠線 |
| `--color-border-strong` | 強調枠・アクセント寄りの青 |
| `--color-text` | 本文 |
| `--color-muted` | 補助テキスト・ラベル |

### 2.2 ブランド・アクセント

| 変数 | 用途の目安 |
|------|------------|
| `--color-primary` | リンク・主アクションの色 |
| `--color-primary-hover` | ホバー時の濃い青 |
| `--color-primary-soft` | 淡い塗り（アイコン背景など） |
| `--color-primary-tint` | 行ホバー・選択の淡いハイライト |
| `--color-focus-ring` | フォーカスリング（`box-shadow` と併用） |

### 2.3 意味付きカラー（ステータス）

| 変数 | 用途 |
|------|------|
| `--color-success` | 成功 |
| `--color-danger` | エラー・削除など |
| `--color-warning` | 警告 |
| `--color-info` | 情報 |
| `--color-dark` | ダークボタン・トースト系 |

### 2.4 レイアウト専用

| 変数 | 用途 |
|------|------|
| `--color-iconbar-bg` | 左アイコンバー背景 |
| `--color-iconbar-text` | アイコンバー上の文字・アイコン色 |
| `--color-toast-bg` | トースト背景 |

### 2.5 余白・角丸・影・レイアウト寸法

| 変数 | 値の例 | 用途 |
|------|--------|------|
| `--space-xs` … `--space-xxl` | 4px〜32px | ギャップ・パディング |
| `--radius-sm`, `--radius-md` | 4px, 6px | 角丸 |
| `--shadow-sm`, `--shadow-md` | 定義済み | 浮き・ドロップシャドウ |
| `--header-height` | 64px（狭い画面で 60px に上書き） | ヘッダー高 |
| `--iconbar-width` | 60px 前後（ブレークポイントで可変） | アイコンバー幅 |
| `--sidebar-width` | 260px | サイドバー幅 |

### 2.6 フォント

- 本文: `"Inter", "Noto Sans JP", system-ui, …`
- アイコン: Material Symbols Rounded（HTML で Google Fonts 読込）

---

## 3. クラス命名のルール

### 3.1 レイアウトシェル（`admin-*`）

アプリ枠・ナビゲーション周りは **`admin-` プレフィックス**で統一します。

例: `admin-layout`, `admin-header`, `admin-navbar`, `admin-iconbar`, `admin-sidebar`, `admin-main`, `admin-side-nav`, `admin-footer`

- **レイアウトバリアント**: `admin-layout--no-iconbar`・`admin-layout--no-sidebar` のように **`--`** で修飾（BEM の modifier に相当）。
- **状態**: **`is-*`**（後述）を併用。例: `admin-layout.is-nav-open`

### 3.2 汎用 UI ブロック（`ui-*`）

フォーム部品・アラート・テーブル・モーダルなど、画面内で繰り返し使うパターンは **`ui-` プレフィックス**です。

例: `ui-form`, `ui-field`, `ui-label`, `ui-control`, `ui-btn--primary`, `ui-alert`, `ui-modal`, `ui-chat`, `ui-table`

- **バリアント / トーン**: **`ui-◯◯--◆◆`**（ハイフン二重）。  
  例: `ui-btn--outline`, `ui-btn--danger`, `ui-alert--info`, `ui-table--striped`
- **ブロック内のパーツ名**は、**長い `block__element` は避け**、短いクラス名をブロック配下に置き、**CSS は子孫セレクタで束ねる**方針です（下記 §4）。

### 3.3 ダッシュボード固有ブロック

意味のあるまとまりは、短い **ケバブケースのブロック名**でよいです。

例: `scope-field`, `summary-box`, `info-row`, `document-box`, `content-nav`, `dashboard-section`, `meta-text`

### 3.4 状態クラス（`is-*`）

UI の一時的な状態は **`is-` プレフィックス**を推奨します。

例: `is-active`, `is-open`, `is-disabled`, `is-me`（チャットの自分側）, `is-strong`（`meta-text` と併用して太字強調）, `is-nav-open`

グローバルな見た目変更は `.block.is-state` の形で CSS を書きます。

### 3.5 データ属性（JS・ツールチップ）

- 挙動用: `data-toggle`, `data-action`, `data-modal-overlay` など（`app.js` と連携）。
- アイコンバー hover ラベル: **`data-tooltip`**（CSS の `attr(data-tooltip)` で表示）。

### 3.6 命名で避けたいこと

- **`block__element` 形式の長いクラス**は増やさない（既存も短い子クラス＋子孫セレクタへ寄せる）。
- 意味のない略語だけのクラス名は避け、**役割が分かる英単語 or 短い日本語ローマ字**にする。

---

## 4. CSS の指定ルール

### 4.1 トークン優先

色・主要な余白・角丸・影は **`var(--…)`** を使う。メディアクエリ内で `--header-height` などを上書きしてレイアウトを調整する。

### 4.2 子要素は「ブロック + 短いクラス + 子孫セレクタ」

例（方針の要約）:

| 避けたい例 | 推奨のイメージ |
|------------|----------------|
| `.summary-box__label` | `.summary-box .label` |
| `.info-row__meta` | `.info-row .meta` |
| `.ui-chat__header`（HTML 側） | `.ui-chat .header`（ブロック直下の意味で短名） |

モーダルなど **直下だけ** に効かせたい場合は **子結合子** `>` を使う。

例: `.ui-modal > .header`, `.ui-modal > .body`, `.ui-modal > .footer`

### 4.3 リストグループ内の子

`.ui-listgroup` の直接の子に対してスタイルを当て、**その中の** `.title` / `.meta` などは `.ui-listgroup > * .title` のようにスコープする。他ブロックの `.title` と衝突しにくくするため。

### 4.4 フォームコントロール

- 単一行入力・セレクト等: `.ui-control`
- `select` をブロック内だけに効かせる場合: `.scope-field select` のように **要素型＋祖先** でもよい（クラス名の短縮とトレードオフ）。

### 4.5 ボタン（`ui-btn--*`）

`.admin-main` 内の `button` / `a` に `ui-btn--*` クラスを付与する想定で、色・サイズは `styles.css` 側でまとめて定義。フッター内のボタンなど、**特定コンテナ配下だけ**に効かせるセレクタ（例: `.ui-modal > .footer > button`）と併用している箇所あり。

### 4.6 レスポンシブ（参考）

- **1180px 以下**: `summary-grid` など一部グリッドを 2 列化。`admin-navbar` は**非表示にしない**（横スクロールで利用可能）。
- **900px 以下**: サイドバー／アイコンバーをオフキャンバス化、`sidebar-toggle` 表示。
- **640px 以下**: ヘッダー上の **`admin-navbar` は非表示**（スペース確保）。ロゴはミニ表示など。

### 4.7 アクセシビリティ

- アイコンのみ表示時は **`aria-label`** をリンクに付与。
- フォーカス可視: `:focus-visible` と `--color-focus-ring` を活用（既存パターンに合わせる）。

### 4.8 アニメーション

- `prefers-reduced-motion: reduce` 時はトランジション等を極力短くするメディアクエリあり。激しいアニメを足す場合は同様に配慮する。

### 4.9 インライン `style` を避ける

- HTML の `style="..."` は使わず、**`assets/css/styles.css` にクラスを足す**。
- 繰り返しの余白・レイアウトは **`ui-scroll-x`**, **`ui-form--gap-xl`**, **`ui-field--mt-xl`** などの **`ui-*` 修飾クラス**、または **`.section-block` 配下の文脈ルール**（例: `.section-block > .section-header + .ui-alert`）で表現する。
- ページ全体の縦間隔は **`.dashboard-content` の `gap`** を優先し、個別要素への `margin-bottom` の重ねがけは避ける。

---

## 5. HTML 整合性のチェック項目（自己点検用）

静的プレビュー（`file://` やルート直下のサーバー）では次を揃えると迷いが減ります。

- **アセット**: ルートは `assets/css/styles.css` 等、`admin-pages/` は `../assets/...`。
- **`admin-navbar`**: トップレベルは各 `a` に `aria-label`。ラベル「**ページ**」は **`page-index.html`（ページ一覧）** へ。一覧の中では **基本フォーム** と **一覧** を同じグループとして扱う。開発用では **`admin-iconbar` の5アイコンと同じ並び・リンク先**に揃える。
- **`admin-iconbar`**: **5 アイコン**（ダッシュボード → ページ → コンポーネント → モーダル → アイコンバーなし）。**ページ**は `page-index.html` へ。ホバー用に **`data-tooltip`**（タッチ主体では `:hover` ツールチップは出ない前提）。
- **`admin-sidebar`（ページサンプル）**: **「ページ」**を `has-submenu` の親ボタンとし、子の **`submenu`** に **基本フォーム**・**一覧** のみを並べる。`page-index.html` 上では子に `is-active` は付けない（親のみ開いた状態）。
- **`admin-layout--no-iconbar`**: `admin-iconbar` を置かない（意図したレイアウトのサンプル）。
- **`admin-layout--no-sidebar`**: `admin-sidebar` を置かない。PC ではサイドバー列を確保しない（例: `pages/calendar.html`）。`admin-iconbar` がある場合はアイコンバー＋メインの2列。`--no-iconbar` と併用時はヘッダー＋メインのみ。
- **`ui-modal`**: `.header` / `.body` / `.footer`、見出しは `.header` 内の `.title`、閉じるは `.close`。
- **状態**: `meta-text` の強調は **`is-strong`**（`--` 修飾の別クラスにしない）。
- **避けるもの**: クラス名の `__` 連結（子は短名＋子孫セレクタで CSS）。**インライン `style`**（§4.9）。

---

## 6. 追記・変更のしかた

- 新しい色が必要な場合はまず **` :root` に変数追加**し、コンポーネントから参照する。
- 新ブロックを足すときは、**既存の `admin-` / `ui-` のどちらに近いか**を決め、§3 のプレフィックスに合わせる。
- 本ドキュメントはコードと乖離したら、**変数一覧・ブレークポイントは `styles.css` を正**として追記・修正する。

---

*最終更新: コードベース（`assets/css/styles.css`）に基づく。*
