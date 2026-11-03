### 1. `src/ui/GraveOverlay.ts:431-436`
* **Symptom (Iframe focus trap & stuck keys):** After closing an embedded game, Phaser keys remain stuck (player continuously walks/acts) and keyboard focus stays lost in the detached iframe/body because canvas lacks `tabindex` and Phaser keys are not reset.
* **Exact fix:**
```typescript
    if (this.gameScene?.input?.keyboard) {
      this.gameScene.input.keyboard.enableGlobalCapture();
      this.gameScene.input.keyboard.resetKeys();
    }
    window.focus();
    const canvas = this.gameScene?.game?.canvas as HTMLCanvasElement | undefined;
    if (canvas) {
      if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '0');
      canvas.focus();
    }
```

---

### 2. `src/ui/GraveOverlay.ts:188-193` & `449-452`
* **Symptom (Esc conflict & phantom input block):** Pressing `Escape` does not prevent default/propagation, bubbling to parent handlers. When closing, `pointer-events: all` lingers during the 420ms fade-out, swallowing all desktop clicks and mobile taps.
* **Exact fix:**
```typescript
    // In handleEsc (line 188):
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.triggerExit();
      }
    };

    // In unmount() (line 449):
    this.overlayEl.style.pointerEvents = 'none';
    this.overlayEl.style.opacity = '0';
```

---

### 3. `src/ui/GraveOverlay.ts:172-173`
* **Symptom (Mobile ghost clicks):** On touchscreens, `exitBtn` fires `touchend` followed ~300ms later by a synthetic `click`, triggering ghost taps on the game canvas or joystick underneath.
* **Exact fix:**
```typescript
    exitBtn.addEventListener('click', () => this.triggerExit());
    exitBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.triggerExit();
    }, { passive: false });
```

---

### 4. `src/ui/GraveOverlay.ts:95`
* **Symptom (Text & button overflow cutoff on 390x844):** `content` has `overflow: hidden;`. On 390px phones (portrait or landscape), the app container, long epitaphs, and the exit button are clipped off-screen with no way to scroll to exit.
* **Exact fix:**
```typescript
    content.style.cssText = `
      position: absolute;
      inset: 0;
      background-color: #0e1526;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 32px;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    `;
```

---

### 5. `src/scenes/UIScene.ts:140-147`
* **Symptom (Mobile joystick permanently lost):** `overlayOpened` hides the joystick, but `UIScene` has no `overlayClosed` listener. Closing a grave overlay leaves the player permanently unable to move on phones.
* **Exact fix:**
```typescript
    this.events.on('overlayOpened', () => {
      this.eggHintText?.setVisible(false);
      this.hideLoreCard();
      this.hint.hide(true);
      this.joystick.hide();
    });
    this.events.on('overlayClosed', () => {
      this.joystick.show();
    });
```

---

### 6. `src/ui/ProximityHint.ts:15` & `src/scenes/UIScene.ts:184, 357`
* **Symptom (UI elements off-screen on 390x844):** `ProximityHint` is hardcoded at `(640, 650)` and Plaque/LoreCard containers at `(640, 24)`. On a 390px wide phone, x=640 places them 250px completely off-screen to the right.
* **Exact fix:**
```typescript
// src/ui/ProximityHint.ts:15
super(scene, scene.scale.width / 2, scene.scale.height - 70);

// src/scenes/UIScene.ts:184 (createPlaque) & 357 (createLoreCard)
const container = this.add.container(this.scale.width / 2, 24);
```

---

### 7. `src/scenes/UIScene.ts:333-345` & `86-96`
* **Symptom (Overlapping UI & stuck lore card):** `showLoreCard()` hides the plaque, but `showPlaque()` does not hide the lore card, rendering both 500px NineSlice panels directly on top of each other. Also, clicking Credits pauses `UIScene` without dismissing active lore cards.
* **Exact fix:**
```typescript
  // In showPlaque() (line 333):
  private showPlaque(): void {
    if (this.plaqueVisible) return;
    if (this.loreCardVisible) this.hideLoreCard();
    this.plaqueVisible = true;
...

  // In creditsBtn pointerdown (line 88):
  creditsBtn.on('pointerdown', () => {
    this.hideLoreCard();
    this.eggHintText?.setVisible(false);
    this.hidePlaque();
...
```

---

### 8. `src/ui/Joystick.ts:104-126`
* **Symptom (Invisible touch traps):** Calling `hide()` only hides sprites/text. Phaser interactive hitboxes (`fButton.input`) and RexVirtualJoystick touch listeners remain active, intercepting mobile taps while invisible.
* **Exact fix:**
```typescript
  show(): void {
    if (this.fButton) {
      this.fButton.setVisible(true);
      if (this.fButton.input) this.fButton.input.enabled = true;
    }
    if (this.joyStick) {
      (this.joyStick as any).setEnable?.(true);
      if (this.joyStick.base?.setVisible) this.joyStick.base.setVisible(true);
      if (this.joyStick.thumb?.setVisible) this.joyStick.thumb.setVisible(true);
    }
  }

  hide(): void {
    if (this.fButton) {
      this.fButton.setVisible(false);
      if (this.fButton.input) this.fButton.input.enabled = false;
    }
    if (this.joyStick) {
      (this.joyStick as any).setEnable?.(false);
      if (this.joyStick.base?.setVisible) this.joyStick.base.setVisible(false);
      if (this.joyStick.thumb?.setVisible) this.joyStick.thumb.setVisible(false);
    }
  }
```
