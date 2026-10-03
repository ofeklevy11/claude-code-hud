<div dir="rtl">

# claude-code-hud

**mod ל-Claude Code שמציג מעל תיבת הכתיבה את מה שבאמת חשוב לדעת תוך כדי עבודה: כמה מקום נשאר בחלון הקונטקסט, כמה נשאר ממכסת 5 השעות ומתי היא מתאפסת, כמה זמן לקח הפרומפט האחרון וכמה זמן עבדו כל הפרומפטים בסשן ביחד, וכמה עלה הסשן.**

<div dir="ltr">

```
── ⚡ Session HUD · session-hud ──────────────────────────────────────────────
🧠 Context window      ⚡ 5-hour limit        ⏱ Prompt time       💵 Session cost
████░░░░░░░░░ 17%      █░░░░░░░░░░░░ 5%       last  3:56          $2.06
830K left of 1M        ↻ 4h 24m               all   14:02         this session
```

</div>

עובד באפליקציית הדסקטופ (לשונית Code) ובטרמינל.

## מה מקבלים

ארבעה כרטיסים זה לצד זה:

| כרטיס | מה הוא מציג |
|---|---|
| **🧠 Context window** | פס של מילוי חלון הקונטקסט באחוזים, וכמה טוקנים נשארו. מתעדכן אחרי כל פעולה של Claude ואחרי דחיסה של השיחה. |
| **⚡ 5-hour limit** | פס של מכסת 5 השעות באחוזים, וכמה זמן נשאר עד שהיא מתאפסת. |
| **⏱ Prompt time** | שני שעונים. הסבר מתחת לטבלה. |
| **💵 Session cost** | כמה הסשן עלה עד עכשיו, בדולרים. |

הצבעים של הפסים: ירוק עד 60%, צהוב עד 85%, אדום מעל. כשפרומפט ארוך (2 דקות ומעלה) נגמר, קופצת הודעה.

**שני השעונים, ומה ההבדל ביניהם:**
- **now / last:** הזמן של פרומפט אחד, מהשליחה ועד ש-Claude סיים. בזמן שהוא עובד השעון רץ בתכלת ("now"). כשהוא מסיים, נשאר הזמן של הפרומפט האחרון ("last").
- **all:** סכום הזמנים של כל הפרומפטים בסשן. אם היו פרומפטים של 3, 7 ו-4 דקות, יופיע `14:00`. נספר רק הזמן ש-Claude עבד בפועל, בלי הזמן שבו הסשן חיכה לכם.

**הפריסה מתאימה את עצמה לרוחב החלון:**

<div dir="ltr">

```
── ⚡ Session HUD · session-hud ───────────
🧠 Context window      ⚡ 5-hour limit
████████░░░░ 17%       ██░░░░░░░░░░ 5%
830K left of 1M        ↻ 4h 24m
⏱ 3:56 last  ·  ⌛ 14:02 all  ·  💵 $2.06
```

</div>

- **חלון רחב:** ארבעת הכרטיסים בשורה אחת.
- **חלון בינוני ו-split view:** שני הפסים זה לצד זה, ומתחתם שורה אחת עם השעונים והעלות.
- **חלון צר מאוד:** שורה קצרה לכל פס, ומתחתן שורת השעונים והעלות.

## התקנה

### 1. מעתיקים את התיקייה `session-hud` לתיקיית הסקילים

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

בלי git: מורידים ZIP מ-GitHub ומעתיקים ידנית את התיקייה `session-hud` לתוך `~/.claude/skills/` (ב-Windows: `C:\Users\<שם>\.claude\skills\`).

### 2. באפליקציית הדסקטופ: מוסיפים משתנה אחד ל-settings.json ⚠️

**זה השלב שבלעדיו זה לא עבד לי.** בטרמינל, mods נטענים ומתעדכנים לבד. באפליקציית הדסקטופ, סשן לא עוקב אחרי תיקיית ה-mods: הוא טוען רק את מה שהיה שם ברגע שנפתח, ושום שינוי אחר כך לא נכנס. המשתנה הזה מפעיל את המעקב גם שם.

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

אם כבר יש בלוק `"env"` עם מפתחות אחרים, מוסיפים פסיק אחרי השורה האחרונה בו, ומתחתיה את השורה החדשה. שומרים את הקובץ.

### 3. פותחים סשן חדש

ה-mod נטען בפתיחת סשן, אז סשנים שכבר היו פתוחים לפני ההתקנה לא יציגו אותו. פותחים סשן חדש ושולחים הודעה אחת. הנתונים מתמלאים אחרי התשובה הראשונה.

## התקנתם גרסה קודמת?

עד גרסה 1.2 היו בריפו שני mods נפרדים, `context-meter` ו-`session-hud`. מגרסה 2.0, חלון הקונטקסט נמצא בתוך `session-hud`. אם נשארה אצלכם התיקייה `~/.claude/skills/context-meter`, מחקו אותה, אחרת חלון הקונטקסט יופיע פעמיים. סקריפט ההתקנה מזהיר אם הוא מוצא אותה.

## לא מופיע?

1. **בדקו שהתיקייה במקום הנכון:** צריך להיות `~/.claude/skills/session-hud/.claude-plugin/plugin.json`, ולא תיקייה כפולה כמו `skills/session-hud/session-hud/...`. זה קורה הרבה כשפורסים ZIP.
2. **פתחתם סשן חדש אחרי ההתקנה ואחרי שינוי `settings.json`?** סשן שנפתח קודם לא יטען את ה-mod.
3. **בדיקת תקינות:** מתוך התיקייה `session-hud` מריצים `claude plugin validate .`, וצריך לקבל `Validation passed`.
4. **גרסת Claude Code:** mods קיימים רק בגרסאות חדשות. נבדק על 2.1.286. אם הגרסה שלכם ישנה, עדכנו.
5. **עדיין כלום:** בחלק מהגרסאות מנגנון ה-mods (function hooks) כבוי כברירת מחדל. הוסיפו לאותו בלוק `"env"` גם `"CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"`, ופתחו סשן חדש.

## התאמה אישית

הקוד נמצא ב-`session-hud/hooks/register.tsx`:

- **ספי הצבעים:** הפונקציה `tone`.
- **נקודות המעבר בין הפריסות:** הבדיקות `W >= 96` ו-`W >= 40` בסוף הקובץ.
- **להציג גם את המכסה השבועית:** היום מוצג רק חלון 5 השעות (`st.limits.find(l => l.kind === 'five_hour')`). הנתונים של `seven_day` כבר נשלפים, ונשאר רק להוסיף להם כרטיס.
- **מלכודת אחת:** לא לקרוא למשתנה בשם `h`. רכיבי ה-JSX נבנים דרך פונקציה בשם הזה, ומשתנה באותו שם מסתיר אותה. ה-mod קורס עם `h is not a function`. זה קרה לי.

אחרי כל שינוי מריצים `claude plugin validate .`. אם הוספתם את `CLAUDE_CODE_PLUGIN_DIR_WATCH`, השינוי נטען בסשן הפתוח בלי לפתוח סשן חדש.

## פרטיות

ה-mod קורא רק נתונים שהסשן עצמו כבר מחזיק: מילוי הקונטקסט, מכסות התוכנית והעלות. הוא לא שולח שום דבר לשום מקום ולא כותב קבצים.

## רישיון

MIT

</div>

---

## English

A Claude Code mod that sits above the prompt box as four side-by-side cards:

- **🧠 Context window**: fill bar and tokens left, refreshed after every tool call and after compaction.
- **⚡ 5-hour limit**: fill bar and time until it resets.
- **⏱ Prompt time**: two clocks. **now/last** is one prompt end to end. **all** is every prompt of the session added up, with idle time excluded.
- **💵 Session cost** in USD.

Four cards across on wide windows. Two gauges plus a stats line on medium windows and in split view. Compact lines on very narrow windows.

**Install:** clone, then run `install.ps1` (Windows) or `sh install.sh` (macOS/Linux). Or copy the `session-hud` folder into `~/.claude/skills/` by hand.

**Desktop app:** add `"CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"` to the `env` block of `~/.claude/settings.json`. Without it, a desktop session loads mods only at the moment it opens and never picks up changes afterwards. Then open a new session.

**Upgrading from 1.x:** the separate `context-meter` mod is now part of `session-hud`. Delete `~/.claude/skills/context-meter`, or the context window shows twice.

**Still nothing?**
- Check the folder isn't nested twice.
- Run `claude plugin validate .` inside `session-hud`.
- Update Claude Code (tested on 2.1.286).
- If needed, also add `"CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"`.

Read-only: the mod reads session data only, writes no files, and sends nothing anywhere. MIT licensed.
