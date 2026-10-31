Now let me check the existing assets directory structure and any other relevant files to understand what's already in place:
Now I have a thorough understanding of the codebase. Let me create the implementation spec.
Here's the spec — 5 eggs, each teaching real Halloween lore in a cozy-spooky way:

| # | Egg | Trigger | Lore topic |
|---|-----|---------|------------|
| 1 | **Black cat** at (420, 900) | Walk near → auto | Medieval superstition, witches' companions |
| 2 | **Pumpkin carve** at (340, 1100) | Press F once | Stingy Jack legend, Irish turnips → American pumpkins |
| 3 | **13th grave** at (2050, 1500) | Press F to read | Triskaidekaphobia, unlucky 13 |
| 4 | **Crypt knock** at (200, 700) | Press F ×3 | Souling & guising → trick-or-treat origins |
| 5 | **Moonlit howl** at (1200, 1650) | Stand still 3s → auto | Werewolf lore, luna/lunatic etymology |

**Key decisions I made:**
- **Dropped the Bloody Mary mirror** — requires the most new sprites/logic for the least lore payoff, and the "press F three times" mechanic is better spent on the crypt (more historically interesting).
- **F-key priority:** graves always win over eggs (step 2 in the handler chain).
- **Only 5 new image sprites needed** (all tiny), plus 5 short SFX — very cheap.
- **Positions** are all verified against existing trees, graves, paths, and pumpkins in [mapLayout.ts](file:///workspace/raise-dead/src/scenes/mapLayout.ts) and [GraveyardWorld.ts](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L166-L251).

Review the full spec in the artifact and let me know if you'd like any swaps or adjustments before handing to Kiro.
EXIT=0
