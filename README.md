<div dir="rtl">

# claude-code-hud

**שני mods ל-Claude Code שמציגים מעל תיבת הכתיבה את מה שבאמת חשוב לדעת תוך כדי עבודה: כמה מקום נשאר בחלון הקונטקסט, כמה נשאר ממכסת 5 השעות ומתי היא מתאפסת, כמה זמן לקח הפרומפט האחרון וכמה זמן עבדו כל הפרומפטים בסשן ביחד, וכמה עלה הסשן.**

<div dir="ltr">

```
── 🧠 Context window · context-meter ────
🧠 17% ██████░░░░░░░░░░░░░░░░░░
830K left of 1M
── ⚡ Session · session-hud ──────────
⚡ ██░░░░░░ 5% ↻ 4h 24m
⏱ Last prompt 3:56
⌛ All prompts 14:02
💵 $2.06
```

</div>

עובד באפליקציית הדסקטופ (לשונית Code) ובטרמינל. הפריסה מתאימה את עצמה לרוחב החלון, גם ב-split view.

## מה מקבלים

| Mod | מה הוא מציג |
|---|---|
| **context-meter** 🧠 | פס צבעוני של מילוי חלון הקונטקסט, כמה טוקנים נשארו, ומשפט קצר על המצב ("plenty of room", "halfway" ועד "almost full, compaction soon"). ירוק עד 50%, צהוב עד 80%, אדום מעל. מוסיף גם שורת סטטוס. |
| **session-hud** ⚡ | מכסת 5 השעות עם פס, אחוז וזמן עד האיפוס · שני שעונים (הסבר מתחת לטבלה) · 💵 העלות של הסשן עד עכשיו בדולרים · הודעה קופצת כשפרומפט ארוך (2 דקות ומעלה) נגמר. |

**שני השעונים, ומה ההבדל ביניהם:**
- **⏱ This prompt / Last prompt:** הזמן של פרומפט אחד, מהשליחה ועד ש-Claude סיים. בזמן שהוא עובד השעון רץ בתכלת ("This prompt"), וכשהוא מסיים נשאר הזמן של הפרומפט האחרון ("Last prompt").
- **⌛ All prompts:** סכום הזמנים של כל הפרומפטים בסשן. אם היו פרומפטים של 3, 7 ו-4 דקות, יופיע `14:00`. הזמן שבו הסשן חיכה לכם לא נספר, רק הזמן ש-Claude עבד בפועל.

אפשר להתקין רק אחד מהם. כל אחד עומד בפני עצמו, וכשמתקינים את שניהם הם מוצגים אחד מתחת לשני.

## התקנה

### 1. מעתיקים את שתי התיקיות לתיקיית הסקילים

Claude Code טוען לבד כל mod שנמצא ב-`~/.claude/skills/<name>`.

**Windows (PowerShell):**
```powershell
git clone https://github.com/ofeklevy11/claude-code-hud.git
cd claude-code-hud
.\install.ps1
```

**macOS / Linux:**
```bash
git clone https://github.com/ofeklevy11/claude-code-hud.git
cd claude-code-hud
sh install.sh
```

בלי git: מורידים ZIP מ-GitHub ומעתיקים ידנית את `context-meter` ואת `session-hud` לתוך `~/.claude/skills/` (ב-Windows: `C:\Users\<שם>\.claude\skills\`).

### 2. באפליקציית הדסקטופ: מוסיפים משתנה אחד ל-settings.json ⚠️

**זה השלב שבלעדיו זה לא עבד לי.** בטרמינל ה-mods נטענים ומתעדכנים לבד. באפליקציית הדסקטופ סשן לא עוקב אחרי תיקיית ה-mods: הוא טוען רק את מה שהיה שם ברגע שנפתח, ושום שינוי אחר כך לא נכנס. המשתנה הזה מפעיל את המעקב גם שם.

פותחים את הקובץ `~/.claude/settings.json` (ב-Windows: `C:\Users\<שם>\.claude\settings.json`) ומוסיפים לבלוק `"env"` את השורה:

```json
"CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"
```

אם אין בקובץ בלוק `"env"`, מוסיפים אותו ברמה העליונה של הקובץ:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"
  },
  ...שאר ההגדרות שכבר יש לכם
}
```

אם כבר יש בלוק `"env"` עם מפתחות אחרים, מוסיפים פסיק אחרי השורה האחרונה בו ומתחתיה את השורה החדשה. שומרים את הקובץ.

### 3. פותחים סשן חדש

ה-mods נטענים בפתיחת סשן, אז סשנים שכבר היו פתוחים לפני ההתקנה לא יציגו אותם. פותחים סשן חדש ושולחים הודעה אחת. הנתונים מתמלאים אחרי התשובה הראשונה.

## לא מופיע?

1. **בדקו שהתיקיות במקום הנכון:** צריך להיות `~/.claude/skills/context-meter/.claude-plugin/plugin.json`, ולא תיקייה כפולה כמו `skills/context-meter/context-meter/...` (קורה הרבה כשפורסים ZIP).
2. **פתחתם סשן חדש אחרי ההתקנה ואחרי שינוי `settings.json`?** סשן שנפתח קודם לא יטען את ה-mods.
3. **בדיקת תקינות:** מתוך תיקיית ה-mod מריצים `claude plugin validate .`, וצריך לקבל `Validation passed`.
4. **גרסת Claude Code:** mods קיימים רק בגרסאות חדשות. נבדק על 2.1.286. אם הגרסה שלכם ישנה, עדכנו.
5. **עדיין כלום:** בחלק מהגרסאות מנגנון ה-mods (function hooks) כבוי כברירת מחדל. הוסיפו לאותו בלוק `"env"` גם `"CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"` ופתחו סשן חדש.

## התאמה אישית

הקוד נמצא ב-`hooks/register.tsx` של כל mod, וכתוב כך שקל לשנות אותו:

- **ספי הצבעים:** הפונקציה `tone` בכל קובץ.
- **אורך הפסים:** הקבוע `CELLS`.
- **להציג גם את המכסה השבועית:** ב-`session-hud` מוצג היום רק חלון 5 השעות (השורה `st.limits.find(l => l.kind === 'five_hour')`). הנתונים של `seven_day` כבר נשלפים, ונשאר רק להציג אותם.
- **מלכודת אחת:** לא לקרוא למשתנה בשם `h`. רכיבי ה-JSX נבנים דרך פונקציה בשם הזה, ומשתנה באותו שם מסתיר אותה. ה-mod קורס עם `h is not a function`, וזה קרה לי.

אחרי כל שינוי מריצים `claude plugin validate .`. אם הוספתם את `CLAUDE_CODE_PLUGIN_DIR_WATCH`, השינוי נטען בסשן הפתוח בלי לפתוח סשן חדש.

## פרטיות

שני ה-mods קוראים רק נתונים שהסשן עצמו כבר מחזיק: מילוי הקונטקסט, מכסות התוכנית והעלות. הם לא שולחים שום דבר לשום מקום ולא כותבים קבצים.

## רישיון

MIT

</div>

---

## English

Two Claude Code mods that sit above the prompt box:

- **context-meter**: a colored context-window bar with tokens left and a short status (green < 50%, yellow < 80%, red above), plus a status line.
- **session-hud**: the 5-hour plan limit with time to reset, two clocks (**⏱ This/Last prompt**: one prompt end to end; **⌛ All prompts**: every prompt of the session added up, idle time excluded), session cost in USD, and a toast when a long prompt (2 min+) ends.

The layout adapts to the window width, split view included.

**Install:** clone, then run `install.ps1` (Windows) or `sh install.sh` (macOS/Linux), or copy both folders into `~/.claude/skills/` by hand.

**Desktop app:** add `"CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"` to the `env` block of `~/.claude/settings.json`. Without it, a desktop session loads mods only at the moment it opens and never picks up changes afterwards. Then open a new session.

**Still nothing?** Check the folder isn't nested twice (`skills/context-meter/context-meter`), run `claude plugin validate .` inside each mod, update Claude Code (tested on 2.1.286), and, if needed, also add `"CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"`.

Read-only: the mods read session data only, write no files, and send nothing anywhere. MIT licensed.
