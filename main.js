/* Khan: Westward Conquest - original game by Cody Ebberson (js13kGames 2023, MIT). ZzFX by Frank Force (MIT). Readable build for PewPlay. */
"use strict";
(() => {
  // src/utility.ts
  var gei = (id) => document.getElementById(id);
  var qs = (e, selector) => e.querySelector(selector);
  var ce = (c = "x", innerHTML = "") => {
    const el = document.createElement("div");
    el.classList.add(...c.trim().split(" "));
    el.innerHTML = innerHTML;
    return el;
  };
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max) + 1;
    return Math.floor(Math.random() * (max - min) + min);
  }
  function uuid() {
    return ("10000000-1000-4000-8000" + -1e11).replace(
      /[018]/g,
      (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  function getAttackForData(attack, modData) {
    if (!modData) return attack;
    return Math.ceil(attack * (modData.e ? 1.5 : 1) * (modData.w ? 0.75 : 1));
  }
  function getDefenceForData(defence, modData) {
    if (!modData) return defence;
    return Math.ceil(defence * (!!modData.w ? 0.5 : 1));
  }

  // src/levels.ts
  var levels = {
    1: {
      enemies: () => [getRandomIntInclusive(9, 9)]
    },
    2: {
      enemies: () => [getRandomIntInclusive(9, 9), getRandomIntInclusive(9, 9)]
    },
    3: {
      enemies: () => [getRandomIntInclusive(7, 8)]
    },
    4: {
      enemies: () => [getRandomIntInclusive(7, 8), getRandomIntInclusive(6, 9)]
    },
    5: {
      enemies: () => [getRandomIntInclusive(7, 9), getRandomIntInclusive(5, 7), getRandomIntInclusive(5, 7)]
    },
    6: {
      enemies: () => [4, getRandomIntInclusive(5, 9), getRandomIntInclusive(5, 9)]
    },
    7: {
      enemies: () => [4, 4, getRandomIntInclusive(5, 7)]
    },
    8: {
      enemies: () => [3, 2, getRandomIntInclusive(7, 9)]
    },
    9: {
      enemies: () => [3, 2, 3]
    },
    10: {
      enemies: () => [1, 2, 3, 5]
    }
  };

  // src/GameElement.ts
  var GameElement = class {
    constructor(game) {
      if (game) {
        this.register(game);
      }
    }
    register(game) {
      this.game = game;
    }
  };

  // src/renderer.ts
  function spriteElementBuilder(name, hp, type, mounted, id) {
    const wrapper = ce(`sprite-wrapper ${type === "enemy" /* enemy */ ? "enemy" : "player"} ${mounted ? "mounted" : "x"}`);
    wrapper.id = id;
    const slot = ce("intent-slot");
    const intent = ce("intent");
    intent.appendChild(ce("assault-value"));
    slot.appendChild(intent);
    wrapper.appendChild(slot);
    const figure = ce("figure");
    if (mounted) {
      figure.appendChild(ce("sprite horse"));
    }
    figure.appendChild(ce(`sprite rider ${name}`));
    wrapper.appendChild(figure);
    const d = ce("stats hp");
    d.appendChild(ce("fill"));
    d.appendChild(ce("number", `${hp}/${hp}`));
    wrapper.appendChild(d);
    const e = ce("stats affects");
    e.appendChild(ce("armor", "D 0"));
    e.appendChild(ce("enrage", "E 0"));
    e.appendChild(ce("weak", "W 0"));
    wrapper.appendChild(e);
    return wrapper;
  }
  function cardElementBuilder(card) {
    const wrapper = ce(`card pixel-border type-${card.type}`);
    wrapper.id = card.id;
    const d = ce("detail");
    card.attributes.forEach((attribute) => {
      d.appendChild(ce("x", attribute));
    });
    const b = ce("body");
    if (card.type === "innate" /* innate */) b.appendChild(ce("kind", "Innate ability"));
    b.appendChild(d);
    if (card.data.flavor) b.appendChild(ce("flavor", card.data.flavor));
    if (card.type !== "innate" /* innate */) {
      wrapper.appendChild(ce("cost", card.data.c.toString()));
    } else {
      wrapper.classList.add("innate");
    }
    const title = ce("title", card.name);
    if (card.name.split(" ").some((word) => word.length >= 10)) title.classList.add("long");
    wrapper.appendChild(title);
    wrapper.appendChild(b);
    return wrapper;
  }

  // src/zzfx.ts
  var zzfxV = 0.3;
  var zzfxR = 44100;
  var ctx;
  function getAudioContext() {
    return ctx;
  }
  function unlockAudio() {
    if (!ctx) {
      try {
        ctx = new AudioContext();
      } catch (e) {
        return void 0;
      }
    }
    if (ctx.state === "suspended" && !document.hidden) {
      ctx.resume().catch(() => void 0);
    }
    return ctx;
  }
  function zzfx(...parameters) {
    if (!ctx || ctx.state !== "running") return void 0;
    return zzfxP(zzfxG(...parameters));
  }
  function zzfxP(...samples) {
    const zzfxX = ctx;
    const buffer = zzfxX.createBuffer(samples.length, samples[0].length, zzfxR), source = zzfxX.createBufferSource();
    samples.map((d, i) => buffer.getChannelData(i).set(d));
    source.buffer = buffer;
    source.connect(zzfxX.destination);
    source.start();
    return source;
  }
  function zzfxG(volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0, release = 0.1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0, pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0, bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0) {
    const PI2 = Math.PI * 2;
    const sampleRate = zzfxR;
    const sign = (v) => v > 0 ? 1 : -1;
    const startSlide = slide *= 500 * PI2 / sampleRate / sampleRate;
    const b = [];
    let startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * PI2 / sampleRate, t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length;
    attack = attack * sampleRate + 9;
    decay *= sampleRate;
    sustain *= sampleRate;
    release *= sampleRate;
    delay *= sampleRate;
    deltaSlide *= 500 * PI2 / sampleRate ** 3;
    modulation *= PI2 / sampleRate;
    pitchJump *= PI2 / sampleRate;
    pitchJumpTime *= sampleRate;
    repeatTime = repeatTime * sampleRate | 0;
    for (length = attack + decay + sustain + release + delay | 0; i < length; b[i++] = s) {
      if (!(++c % (bitCrush * 100 | 0))) {
        s = shape ? shape > 1 ? shape > 2 ? shape > 3 ? Math.sin((t % PI2) ** 3) : Math.max(Math.min(Math.tan(t), 1), -1) : 1 - (2 * t / PI2 % 2 + 2) % 2 : 1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) : Math.sin(t);
        s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) * sign(s) * Math.abs(s) ** shapeCurve * // curve 0=square, 2=pointy
        volume * zzfxV * // envelope
        (i < attack ? i / attack : i < attack + decay ? 1 - (i - attack) / decay * (1 - sustainVolume) : i < attack + decay + sustain ? sustainVolume : i < length - delay ? (length - i - delay) / release * // release falloff
        sustainVolume : 0);
        s = delay ? s / 2 + (delay > i ? 0 : (i < length - delay ? 1 : (length - i) / delay) * // release delay
        b[i - delay | 0] / 2) : s;
      }
      f = (frequency += slide += deltaSlide) * // frequency
      Math.cos(modulation * tm++);
      t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);
      if (j && ++j > pitchJumpTime) {
        frequency += pitchJump;
        startFrequency += pitchJump;
        j = 0;
      }
      if (repeatTime && !(++r % repeatTime)) {
        frequency = startFrequency;
        slide = startSlide;
        j = j || 1;
      }
    }
    return b;
  }

  // src/settings.ts
  var PREFIX = "khan-westward-conquest:";
  function load(key, fallback) {
    try {
      const v = window.localStorage.getItem(PREFIX + key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, String(value));
    } catch (e) {
    }
  }
  var globals = {
    /** music is currently playing */
    music: false,
    /** player wants music (remembered) */
    musicWanted: load("music", "1") === "1",
    sfx: load("sfx", "1") === "1",
    tutorial: false,
    difficulty: Math.min(5, Math.max(1, Number(load("difficulty", "1")) || 1))
  };

  // src/sounds.ts
  var play = (params) => {
    if (globals.sfx) zzfx(...params);
  };
  var sounds_default = {
    draw: () => play([0.25, , 323, 0.03, 0.02, 0.08, 1, 0.59, 14, , , , , 1.5, , , , 0.64, 0.09]),
    ability: () => play([0.5, , 316, 0.01, 0.05, 0.06, 1, 0.22, -5.6, -2.4, , , , 1.8, , 0.1, , 0.79, 0.09]),
    assault: () => play([1, , 255, 0.02, 0.04, 0.09, 4, 1.31, -0.2, , , , , 1.3, , 0.3, 0.19, 0.52, 0.04, 0.22]),
    defense: () => play([0.75, 0, 2838, 0.01, , 0.2, 2, 1.98, , , 35, 0.02, , 0.1, , 0.1, 0.08, 0.75, 0.1, 0.12]),
    buttonInteract: () => play([0.5, , 1500, 0.01, , 0.23, 4, 5, , , , , , 1, -30, , , 0.5, , 1]),
    cardSelect: () => play([0.5, , 1836, 0.14, 0.01, 0.07, 4, 2.9, 28, 74, , , 0.19, , , , , 0.33, , 0.91])
  };

  // src/entity.ts
  function flashChanged(el) {
    el.classList.remove("changed");
    void el.offsetWidth;
    el.classList.add("changed");
    setTimeout(() => {
      el.classList.remove("changed");
    }, 1500);
  }
  var Entity = class extends GameElement {
    constructor(data2, game) {
      super(game);
      const { name, type, hp } = data2;
      this.id = uuid();
      this.data = { ...data2 };
      this.currentHp = data2.hp;
      this.sprite = spriteElementBuilder(name, hp, type, data2.mounted, this.id);
      this.sprite.addEventListener("click", () => {
        game.entitySelect(this.id);
      });
      this.isPlayer = this.data.type === "player" /* player */;
    }
    render() {
      var _a;
      (_a = gei(this.data.type)) == null ? void 0 : _a.appendChild(this.sprite);
      this.update();
    }
    update(changed) {
      const fillEl = qs(this.sprite, `.hp .fill`);
      fillEl.style.width = Math.round(this.currentHp / this.data.hp * 100) + "%";
      this.data.d > 0 ? fillEl.classList.add("armored") : fillEl.classList.remove("armored");
      qs(this.sprite, ".hp .number").innerHTML = `${this.currentHp}/${this.data.hp}`;
      const dEl = qs(this.sprite, ".affects .armor");
      dEl.innerHTML = "D " + this.data.d;
      dEl.classList.toggle("zero", !this.data.d);
      if (changed == null ? void 0 : changed.d) flashChanged(dEl);
      const eEl = qs(this.sprite, ".affects .enrage");
      eEl.innerHTML = "E " + this.data.e;
      eEl.classList.toggle("zero", !this.data.e);
      if (changed == null ? void 0 : changed.e) flashChanged(eEl);
      const wEl = qs(this.sprite, ".affects .weak");
      wEl.innerHTML = "W " + this.data.w;
      wEl.classList.toggle("zero", !this.data.w);
      if (changed == null ? void 0 : changed.w) flashChanged(wEl);
    }
    applyFromEnemy(cardData) {
      var _a, _b;
      let changed = {};
      const { a = 0, aa = 0, wa = 0, w = 0 } = cardData;
      let d = this.data.d;
      if (a > 0 && this.data.d > 0) {
        changed.d = this.data.d;
        d = d - a;
        if (d < 0) {
          this.currentHp = Math.min(this.data.hp, Math.max(0, this.currentHp - (a - this.data.d)));
          this.data.d = 0;
        } else {
          this.data.d = d;
        }
      } else {
        this.currentHp = Math.min(this.data.hp, Math.max(0, this.currentHp - a));
      }
      this.data.w += w;
      if (w > 0) changed.w = w;
      this.update(changed);
      if (this.currentHp <= 0) {
        (_a = this.game) == null ? void 0 : _a.onDeath(this);
      }
      const parsedData = {};
      if (aa > 0) parsedData.a = aa;
      if (wa > 0) parsedData.w = wa;
      if (Object.keys(parsedData).length) (_b = this.game) == null ? void 0 : _b.applyToAllEnemies(parsedData);
    }
    applyFromFriendly(cardData) {
      var _a;
      let changed = {};
      const { d = 0, e = 0, hp = 0 } = cardData;
      this.currentHp = Math.min(this.data.hp, Math.max(0, this.currentHp + hp));
      this.data.d += d;
      this.data.e += e;
      if (d > 0) changed.d = d;
      if (e > 0) changed.e = e;
      this.update(changed);
      if (this.currentHp <= 0) {
        (_a = this.game) == null ? void 0 : _a.onDeath(this);
      }
    }
    startTurn() {
      this.data.d = 0;
      this.update();
    }
    endTurn() {
      this.data.e = Math.max(0, this.data.e - 1);
      this.data.w = Math.max(0, this.data.w - 1);
      this.update();
    }
    do(type) {
      let animationName = "";
      switch (type) {
        case "ability" /* ability */:
          sounds_default.ability();
          animationName = "bumpUp";
          break;
        case "assault" /* assault */:
          sounds_default.assault();
          animationName = this.isPlayer ? "bumpLeft" : "bumpRight";
          break;
        case "defense" /* defense */:
          sounds_default.defense();
          animationName = this.isPlayer ? "bumpRight" : "bumpLeft";
          break;
      }
      this.sprite.style.animationName = animationName;
      setTimeout(() => {
        const e = qs(this.sprite, ".intent");
        e.className = "intent";
        qs(e, ".assault-value").innerHTML = "";
      }, 500);
      setTimeout(() => {
        this.sprite.style.animation = "";
      }, 1e3);
    }
  };

  // src/player.ts
  var Player = class extends Entity {
    constructor(data2, game) {
      super(data2, game);
      this.data = { ...data2 };
      this.currentStamina = data2.stamina;
    }
    resetStamina() {
      this.currentStamina = this.data.stamina;
    }
    resetProperties() {
      this.data.d = 0;
      this.data.w = 0;
      this.data.e = 0;
    }
    startRound() {
      this.resetProperties();
      this.resetStamina();
    }
    startTurn() {
      super.startTurn();
      this.resetStamina();
      this.update();
    }
    applyFromEnemy(cardData) {
      super.applyFromEnemy(cardData);
    }
    applyFromFriendly(cardData) {
      var _a, _b;
      super.applyFromFriendly(cardData);
      const { s = 0, draw = 0, mhp = 0, ca = 0 } = cardData;
      this.currentStamina += s;
      this.currentHp += mhp;
      this.data.hp += mhp;
      if (ca > 0) {
        this.data.e = 0;
        this.data.w = 0;
      }
      if (draw > 0) {
        (_a = this.game) == null ? void 0 : _a.deck.startDraw(draw);
      }
      this.update();
      if (this.currentHp <= 0) {
        (_b = this.game) == null ? void 0 : _b.onDeath(this);
      }
    }
    applyInnate(cards2, type) {
      var _a;
      let applyCards = [];
      switch (type) {
        case "buff" /* buff */:
          applyCards = cards2.filter((card) => card.data.on === "buff" /* buff */);
          (_a = this.game) == null ? void 0 : _a.onPlayerBuffsApplied(applyCards);
          break;
        case "round" /* round */:
          applyCards = cards2.filter((card) => card.data.on === "round" /* round */);
          break;
        case "turn" /* turn */:
          applyCards = cards2.filter((card) => card.data.on === "turn" /* turn */);
          break;
      }
      applyCards.forEach((card) => {
        var _a2;
        this.applyFromFriendly(card.data);
        if (card.data.w) {
          (_a2 = this.game) == null ? void 0 : _a2.applyToAllEnemies(card.data);
        }
      });
    }
    play(card) {
      this.currentStamina -= card.data.c || 0;
      this.update();
    }
  };

  // src/card.ts
  var Card = class extends GameElement {
    constructor(constructorData) {
      super();
      const [name, type, data2] = constructorData;
      this.id = uuid();
      this.name = name;
      this.type = type;
      this.data = { ...data2 };
      this.attributes = [];
    }
    dData(modData) {
      return {
        ...this.data,
        a: getAttackForData(this.data.a || 0, modData),
        aa: getAttackForData(this.data.aa || 0, modData),
        d: getDefenceForData(this.data.d || 0, modData)
      };
    }
  };
  var VisualCard = class extends Card {
    constructor(constructorData, isCardAdd = false) {
      super(constructorData);
      this.buildVisualAttributes(this.data);
      this.sprite = cardElementBuilder(this);
      this.listener = isCardAdd ? this.deckAddSelect.bind(this) : this.cardSelect.bind(this);
      if (isCardAdd) {
        this.sprite.addEventListener(
          "click",
          this.listener
        );
      } else {
        this.sprite.addEventListener(
          "click",
          this.listener
        );
      }
    }
    deckAddSelect(event) {
      var _a;
      event.stopPropagation();
      if (((_a = this.game) == null ? void 0 : _a.state) === "picking_card" /* PICKING_CARD */) {
        this.game.deck.selectToAdd(this);
      }
    }
    cardSelect(event) {
      var _a;
      event.stopPropagation();
      (_a = this.game) == null ? void 0 : _a.onPlayerSelectCard(this);
    }
    buildVisualAttributes(data2, modData) {
      const innate = this.type === "innate" /* innate */;
      this.attributes = [];
      if (data2.a) this.attributes.push(`Attack: ${getAttackForData(data2.a, modData)}`);
      if (data2.ca) this.attributes.push(`Clear own Enrage and Weaken`);
      if (data2.aa) this.attributes.push(`Attack all: ${getAttackForData(data2.aa, modData)}`);
      if (data2.wa) this.attributes.push(`Weaken all: ${getAttackForData(data2.wa, modData)}`);
      if (data2.d)
        innate ? this.attributes.push(`+${data2.d} Defend every turn`) : this.attributes.push(`Defend: ${getDefenceForData(data2.d, modData)}`);
      if (data2.e) this.attributes.push(`Enrage self: ${data2.e}`);
      if (data2.w)
        innate ? this.attributes.push(`Weaken all enemies ${data2.w} each stage`) : this.attributes.push(`Weaken: ${data2.w}`);
      if (data2.s) {
        innate ? this.attributes.push(`+${data2.s} Stamina every turn`) : this.attributes.push(`Stamina: +${data2.s}`);
      }
      if (data2.draw) {
        innate ? this.attributes.push(`Draw ${data2.draw} extra card${data2.draw > 1 ? "s" : ""} every turn`) : this.attributes.push(`Draw ${data2.draw} card${data2.draw > 1 ? "s" : ""}`);
      }
      if (data2.mhp) this.attributes.push(`+${data2.mhp} max life (once)`);
      if (data2.hp && data2.hp < 0) this.attributes.push(`Lose ${Math.abs(data2.hp)} life`);
      if (data2.hp && data2.hp > 0) {
        innate ? this.attributes.push(`Heal ${data2.hp} life at the start of each stage`) : this.attributes.push(`Heal ${data2.hp} life`);
      }
    }
    update(modData) {
      this.buildVisualAttributes(this.data, modData);
      const newSprite = cardElementBuilder(this);
      this.sprite.replaceChildren(...newSprite.childNodes);
    }
  };
  var basicCards = [
    ["Saber Attack", "assault" /* assault */, { a: 8, c: 1, flavor: "The Khan's favorite weapon, designed for use on horseback: a slightly curved blade 30 to 40 inches long." }],
    ["Bambai Shield", "defense" /* defense */, { d: 10, c: 1, flavor: "The Khan's favorite shield: round and domed, first woven from reeds and leather, later forged from metal." }],
    ["War Cry", "ability" /* ability */, { c: 1, wa: 1, e: 2, flavor: "On hearing the screams of the Khan's army, enemies could scarcely move to defend themselves." }],
    ["Rally Cry", "defense" /* defense */, { c: 2, d: 18, e: 1, flavor: "Such were the Khan's regrouping tactics that enemies could find nowhere to strike." }],
    ["Tactical Retreat", "defense" /* defense */, { c: 2, d: 14, draw: 1, flavor: "Better to retreat and lure the enemy into a trap of your own making." }],
    ["Surgical Strike", "assault" /* assault */, { c: 1, a: 12, draw: 1, flavor: "Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt." }]
  ];
  var cards = [
    ["Recharge", "ability" /* ability */, { c: 0, s: 2, flavor: "The Khan's army could rest on the move, allowing them to be where no one thought they could be." }],
    ["Push Through", "ability" /* ability */, { c: 1, draw: 3, flavor: "Any obstacle may be overcome with enough force." }],
    ["Clairvoyance", "ability" /* ability */, { c: 0, draw: 2, flavor: "The Khan had a preternatural ability with strategy, to know what to do next." }],
    ["Shield Wall", "defense" /* defense */, { c: 3, d: 30, e: 2, flavor: "Shields locked together, the army stood like a single wall of iron." }],
    ["Reluctant Withdrawal", "defense" /* defense */, { c: 1, d: 12, e: 3, flavor: "The Khan grew more determined, and more angry, with every forced step backwards." }],
    ["Whirling Dervish", "assault" /* assault */, { c: 2, aa: 10, wa: 2, flavor: "The Persians were a magnificent addition to the Khan's army." }],
    ["Wrath Of Khan", "assault" /* assault */, { c: 3, aa: 15, e: 4, hp: -10, flavor: "The Khan was merciless, sometimes reckless, in pursuit of his enemies." }],
    ["Reckless Assault", "assault" /* assault */, { c: 2, a: 25, hp: -5, flavor: "Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt." }],
    ["Overpower", "assault" /* assault */, { c: 2, a: 18, w: 2, flavor: "Attack where the enemy is unprepared, appear where you are not expected." }],
    ["Cavalry Charge", "assault" /* assault */, { c: 4, aa: 18, flavor: "The Khan's cavalry was second to none, thanks in no small part to the stirrup." }],
    ["Shock and Awe", "ability" /* ability */, { c: 2, e: 3, wa: 3, flavor: "Supreme excellence consists of breaking the enemy's resistance without fighting." }],
    ["Combat Medics", "defense" /* defense */, { c: 1, d: 8, hp: 6, flavor: "A little ginseng, some water, a BIG shield and you'll be back up in no time." }],
    ["Field Hospital", "ability" /* ability */, { c: 2, hp: 12, flavor: "He will win who knows when to fight and when not to fight." }],
    ["Meditation", "ability" /* ability */, { c: 1, ca: 1, flavor: "It is the unemotional, reserved, calm, detached warrior who wins, not the hothead seeking vengeance." }]
  ];
  var innateCards = [
    ["Strategic Planning", "innate" /* innate */, { on: "turn" /* turn */, c: 0, draw: 1, flavor: "Water shapes its course to the ground; the soldier plots victory according to his foe." }],
    ["Calisthenics", "innate" /* innate */, { on: "turn" /* turn */, c: 0, s: 1, flavor: "To not prepare is the greatest of crimes; to be prepared for any contingency is the greatest of virtues." }],
    ["Tengri Spirit", "innate" /* innate */, { on: "round" /* round */, c: 0, hp: 10, flavor: "The Khan was considered the embodiment of Tengri, the highest deity." }],
    ["Fearsome Reputation", "innate" /* innate */, { on: "round" /* round */, c: 0, w: 5, flavor: "Supreme excellence consists of breaking the enemy's resistance without fighting." }],
    ["Scientific Advancement", "innate" /* innate */, { on: "buff" /* buff */, c: 0, mhp: 10, flavor: "To fight harder, be stronger, and live longer one must do more than just cross swords." }],
    ["Defensive Perimeter", "innate" /* innate */, { on: "turn" /* turn */, c: 0, d: 5, flavor: "The wise general makes himself invincible first, then waits for the enemy to become vulnerable." }]
  ];

  // src/deck.ts
  var MAX_IN_HAND = 8;
  var alreadyShownCardsQueue = [];
  var alreadyShownInnateCardsQueue = [];
  function pickNewNumberIfInSeenCollection(collection, seenCollection, pickCollection, collectionMaxLen) {
    let newIds = [];
    collection.forEach((num, i) => {
      let newId = num;
      while (seenCollection.includes(newId) || newIds.includes(newId)) {
        newId = getRandomIntInclusive(0, pickCollection.length - 1);
      }
      newIds.push(newId);
      collection[i] = newId;
    });
    newIds.forEach((id) => {
      seenCollection.push(id);
    });
    while (seenCollection.length > collectionMaxLen) {
      seenCollection.shift();
    }
  }
  function getNewCardsToPick() {
    const c1 = getRandomIntInclusive(0, cards.length - 1);
    let c2 = c1;
    let c3 = c1;
    while (c2 === c1 || c2 === c3) {
      c2 = getRandomIntInclusive(0, cards.length - 1);
    }
    while (c3 === c1 || c3 === c2) {
      c3 = getRandomIntInclusive(0, cards.length - 1);
    }
    const ci1 = getRandomIntInclusive(0, innateCards.length - 1);
    let ci2 = getRandomIntInclusive(0, innateCards.length - 1);
    while (ci1 === ci2) {
      ci2 = getRandomIntInclusive(0, innateCards.length - 1);
    }
    const cardIds = [c1, c2, c3];
    const innateCardIds = [ci1, ci2];
    pickNewNumberIfInSeenCollection(cardIds, alreadyShownCardsQueue, cards, 6);
    pickNewNumberIfInSeenCollection(innateCardIds, alreadyShownInnateCardsQueue, innateCards, 4);
    return [
      new VisualCard(cards[cardIds[0]], true),
      new VisualCard(cards[cardIds[1]], true),
      new VisualCard(cards[cardIds[2]], true),
      new VisualCard(innateCards[innateCardIds[0]], true),
      new VisualCard(innateCards[innateCardIds[1]], true)
    ];
  }
  var Deck = class extends GameElement {
    constructor(game) {
      super(game);
      this.game = game;
      this.drawPile = [
        new VisualCard(basicCards[0]),
        new VisualCard(basicCards[0]),
        new VisualCard(basicCards[0]),
        new VisualCard(basicCards[1]),
        new VisualCard(basicCards[1]),
        new VisualCard(basicCards[2]),
        new VisualCard(basicCards[3]),
        new VisualCard(basicCards[4]),
        new VisualCard(basicCards[5])
      ];
      this.deck = [...this.drawPile];
      this.handPile = [];
      this.donePile = [];
      this.innatePile = [];
      this.pendingDraw = 0;
      this.update();
      this.register(this.game);
    }
    register(game) {
      [this.drawPile, this.handPile, this.donePile].forEach((pile) => pile == null ? void 0 : pile.forEach((card) => card.register(game)));
    }
    selectToAdd(card) {
      this.handPile.forEach((card2) => {
        card2.sprite.classList.remove("selected");
      });
      sounds_default.cardSelect();
      if (this.pendingSelect === card) {
        gei("confirmcard").disabled = true;
        this.pendingSelect = void 0;
      } else {
        gei("confirmcard").disabled = false;
        this.pendingSelect = card;
        this.pendingSelect.sprite.classList.add("selected");
      }
    }
    confirmAdd() {
      var _a, _b;
      if (this.pendingSelect && ((_a = this.game) == null ? void 0 : _a.state) === "picking_card" /* PICKING_CARD */) {
        const el = gei("confirmcard");
        el.disabled = true;
        gei("picker").classList.add("hide");
        (_b = this.game) == null ? void 0 : _b.setState("TRANSITION" /* TRANSITION */);
        this.pendingSelect.sprite.classList.remove("selected");
        this.pendingSelect.sprite.removeEventListener("click", this.pendingSelect.listener);
        this.pendingSelect.listener = this.pendingSelect.cardSelect.bind(this.pendingSelect);
        this.pendingSelect.sprite.addEventListener("click", this.pendingSelect.listener);
        this.pendingSelect.type === "innate" /* innate */ ? this.add(this.pendingSelect, "INNATE" /* INNATE */) : this.add(this.pendingSelect);
        this.pendingSelect = void 0;
      }
    }
    add(card, collection) {
      switch (collection) {
        case "DONE" /* DONE */:
          this.donePile.push(card);
          break;
        case "HAND" /* HAND */:
          this.handPile.push(card);
          break;
        case "INNATE" /* INNATE */:
          this.innatePile.push(card);
          break;
        default:
        case "DRAW" /* DRAW */:
          this.drawPile.push(card);
          break;
      }
      ;
      this.deck.push(card);
      this.update();
      this.game.newCardPicked();
      return this;
    }
    shuffle() {
      const t = [];
      while (this.drawPile.length) {
        t.push(this.drawPile.splice(Math.floor(Math.random() * this.drawPile.length), 1)[0]);
      }
      this.drawPile = t;
      return this;
    }
    shuffleInto(basePile, otherPile) {
      while (otherPile.length) {
        const c = otherPile.splice(Math.floor(Math.random() * otherPile.length), 1)[0];
        const i = getRandomIntInclusive(0, basePile.length);
        basePile.splice(i, 0, c);
      }
    }
    update() {
      gei("deck").innerHTML = `Draw pile: ${this.drawPile.length}`;
      gei("done").innerHTML = `Discard: ${this.donePile.length}`;
    }
    draw(n) {
      var _a;
      this.pendingDraw = n;
      if (n > 0 && this.handPile.length < MAX_IN_HAND) {
        sounds_default.draw();
        if (this.drawPile.length) {
          const c = this.drawPile.pop();
          c.update(this.game.player.data);
          this.handPile.push(c);
          (_a = gei("card-holder")) == null ? void 0 : _a.appendChild(c.sprite);
          this.update();
          this.game.update();
          setTimeout(() => this.draw(--n), 100);
        } else if (this.donePile.length) {
          this.shuffleInto(this.drawPile, this.donePile);
          this.draw(n);
        }
      } else if (this.pendingDraw > 0) {
        this.game.alert("Your hand is full!");
      }
      return this;
    }
    startDraw(n) {
      setTimeout(() => this.draw(n), 100);
    }
    pickNewCards() {
      const cards2 = getNewCardsToPick();
      const el = gei("confirmcard");
      el.disabled = true;
      gei("picker").classList.remove("hide");
      cards2.forEach((card) => {
        var _a;
        card.register(this.game);
        this.handPile.push(card);
        (_a = gei("card-holder")) == null ? void 0 : _a.appendChild(card.sprite);
      });
    }
    updateVisibleCards(modData) {
      this.handPile.forEach((card) => {
        card.update(modData);
      });
    }
    removeFromHand(card, addToDone = true) {
      var _a;
      (_a = card.sprite.parentNode) == null ? void 0 : _a.removeChild(card.sprite);
      if (addToDone) {
        this.donePile.push(card);
      }
      this.handPile.splice(this.handPile.indexOf(card), 1);
      this.update();
      this.game.update();
    }
    removeInnateBuffs(cards2) {
      for (let i = 0; i < this.innatePile.length; i++) {
        const c = this.innatePile[i];
        if (cards2.indexOf(c) !== -1) {
          this.innatePile.splice(i, 1);
          i--;
        }
      }
    }
    clearHand() {
      const card = this.handPile[this.handPile.length - 1];
      if (card) {
        this.removeFromHand(card, false);
        setTimeout(() => this.clearHand(), 100);
      }
    }
    endTurn() {
      const card = this.handPile[this.handPile.length - 1];
      if (card) {
        this.removeFromHand(card);
        setTimeout(() => this.endTurn(), 100);
      }
    }
    endRound() {
      this.endTurn();
      setTimeout(() => {
        this.shuffleInto(this.drawPile, this.donePile);
      }, 1e3);
    }
  };

  // src/dom.ts
  function flashCardCost(card) {
    const el = card.sprite.querySelector(".cost");
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 250);
  }

  // src/enemy.ts
  var Enemy = class extends Entity {
    constructor(data2, game) {
      super(data2, game);
    }
    intent(action) {
      const iEl = this.sprite.querySelector(".intent");
      const aEl = iEl.querySelector(".assault-value");
      iEl.classList.add(action.type);
      if (action.type === "assault" /* assault */) {
        aEl.innerHTML = getAttackForData(action.data.a, this.data).toString();
      }
    }
    pickAction() {
      this.nextAction = new Card(this.data.actions.get());
      this.intent(this.nextAction);
    }
    applyFromEnemy(cardData) {
      super.applyFromEnemy(cardData);
      if (this.nextAction) {
        this.intent(this.nextAction);
      }
    }
  };

  // src/messaging.ts
  var messages = {
    intro: `<p>Oh Great Khan! The Gods have decreed that the world shall know and fear the name of Genghis Khan.
  All lands shall be yours, Oh Great Khan... you must simply go forth and seize them.</p>
  <p>Prepare wisely, and even the Great King of the West will be no match for your might. Go forth and conquer!</p>`,
    final: `<p>Oh Great Khan, you have done it! The King of the West has fallen and all lands are yours, from sea to sea.
  Go forth now and prosper, so that these lands will know the lineage and rule of the Khan until the end of time!</p>`,
    thanks: `<p>Thank you for playing! We hope you enjoyed this tiny game.</p>`,
    fail: `<p>Oh Great Khan, the people mourn you! The Gods must have been mistaken: it was not your destiny to conquer these lands.
  Surely one of your many heirs is meant to wear this mantle. We shall wait for those days of glory to come.</p>`
  };
  var currentHandler;
  function showMessage(message, callback, multiMessage = false, buttonLabel = "Continue") {
    gei("tutorial").disabled = true;
    gei("context").classList.remove("hide");
    gei("message").classList.remove("hide");
    gei("context").classList.add("show");
    gei("content").innerHTML = message;
    gei("content").scrollTop = 0;
    const btn = gei("context-close");
    btn.innerHTML = buttonLabel;
    if (currentHandler) btn.removeEventListener("click", currentHandler);
    const eventHandler = () => {
      btn.removeEventListener("click", eventHandler);
      currentHandler = void 0;
      if (!multiMessage) {
        gei("tutorial").disabled = false;
        gei("context").classList.remove("show");
        gei("context").classList.add("hide");
        gei("message").classList.add("hide");
      }
      callback();
    };
    currentHandler = eventHandler;
    btn.addEventListener("click", eventHandler);
    setTimeout(() => btn.focus({ preventScroll: true }), 50);
  }

  // src/data.ts
  var EnemyActions = class {
    constructor(actions) {
      this.actions = [...actions];
    }
    get() {
      return this.actions[getRandomIntInclusive(0, this.actions.length - 1)];
    }
  };
  var data = {
    startLevel: 1,
    startTurn: 0,
    defaultDraw: 5,
    playerData: {
      name: "khan",
      type: "player" /* player */,
      hp: 50,
      d: 0,
      w: 0,
      f: 0,
      e: 0,
      mounted: true,
      stamina: 4
    },
    enemyData: {
      1: {
        name: "king",
        type: "enemy" /* enemy */,
        hp: 80,
        d: 0,
        w: 0,
        e: 0,
        mounted: true,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 25 }],
          ["", "assault" /* assault */, { a: 20, d: 10 }],
          ["", "assault" /* assault */, { a: 15, d: 15 }],
          ["", "defense" /* defense */, { d: 25, w: 2 }],
          ["", "defense" /* defense */, { d: 20, e: 2, w: 2 }]
        ])
      },
      2: {
        name: "archer",
        type: "enemy" /* enemy */,
        hp: 30,
        d: 0,
        w: 0,
        e: 0,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 15 }],
          ["", "assault" /* assault */, { a: 12 }],
          ["", "assault" /* assault */, { a: 10 }],
          ["", "assault" /* assault */, { a: 8, e: 2 }],
          ["", "assault" /* assault */, { a: 8, w: 2 }]
        ])
      },
      3: {
        name: "knight",
        type: "enemy" /* enemy */,
        hp: 40,
        d: 0,
        w: 0,
        e: 0,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 15 }],
          ["", "assault" /* assault */, { a: 12, e: 2 }],
          ["", "assault" /* assault */, { a: 10, d: 10 }]
        ])
      },
      4: {
        name: "dervish",
        type: "enemy" /* enemy */,
        hp: 28,
        d: 0,
        w: 0,
        e: 0,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 15 }],
          ["", "assault" /* assault */, { a: 10, e: 2 }],
          ["", "assault" /* assault */, { a: 10, w: 1 }]
        ])
      },
      5: {
        name: "bear2",
        type: "enemy" /* enemy */,
        hp: 22,
        d: 0,
        w: 0,
        e: 1,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 10 }],
          ["", "assault" /* assault */, { a: 7, e: 2 }],
          ["", "defense" /* defense */, { d: 10 }],
          ["", "defense" /* defense */, { d: 8, e: 2 }],
          ["", "ability" /* ability */, { e: 3 }]
        ])
      },
      6: {
        name: "bear1",
        type: "enemy" /* enemy */,
        hp: 22,
        d: 0,
        w: 0,
        e: 2,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 10 }],
          ["", "assault" /* assault */, { a: 7, e: 2 }],
          ["", "defense" /* defense */, { d: 10 }],
          ["", "defense" /* defense */, { d: 8, e: 2 }],
          ["", "ability" /* ability */, { e: 3 }]
        ])
      },
      7: {
        name: "rok",
        type: "enemy" /* enemy */,
        hp: 18,
        d: 0,
        w: 0,
        e: 0,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 8, d: 5 }],
          ["", "assault" /* assault */, { a: 4, e: 2 }],
          ["", "assault" /* assault */, { a: 5, e: 2 }],
          ["", "defense" /* defense */, { d: 10 }]
        ])
      },
      8: {
        name: "wolf",
        type: "enemy" /* enemy */,
        hp: 16,
        d: 0,
        w: 0,
        e: 3,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 10 }],
          ["", "assault" /* assault */, { a: 6, e: 2 }],
          ["", "ability" /* ability */, { e: 2, w: 3 }]
        ])
      },
      9: {
        name: "snake",
        type: "enemy" /* enemy */,
        hp: 12,
        d: 0,
        w: 0,
        e: 0,
        mounted: false,
        actions: new EnemyActions([
          ["", "assault" /* assault */, { a: 9, w: 1 }],
          ["", "assault" /* assault */, { a: 5, w: 1, e: 2 }],
          ["", "assault" /* assault */, { a: 7, w: 1 }],
          ["", "defense" /* defense */, { d: 10, e: 3 }]
        ])
      }
    }
  };
  function getEnemyDataWithMult(mult) {
    let multiplyer = 1;
    switch (mult) {
      case 3:
      case 2:
        multiplyer = 1.5;
        break;
      case 4:
        multiplyer = 2;
        break;
      case 5:
        multiplyer = 2.5;
        break;
      default:
        multiplyer = 1;
        break;
    }
    const enemyData = { ...data.enemyData };
    Object.keys(enemyData).forEach((key) => {
      let k = Number(key);
      const e = { ...enemyData[k] };
      if (mult > 2) {
        e.hp = Math.ceil(e.hp * multiplyer);
      }
      let temp = [...e.actions.actions];
      const newActions = [];
      temp.forEach((action) => {
        const newAction = [action[0], action[1], { ...action[2] }];
        const newData = { ...newAction[2] };
        if (newData.a) {
          newData.a *= multiplyer;
        }
        if (newData.d) {
          newData.d *= multiplyer;
        }
        newAction[2] = newData;
        newActions.push(newAction);
      });
      e.actions = new EnemyActions(newActions);
      enemyData[k] = e;
    });
    return enemyData;
  }
  var data_default = data;

  // src/game.ts
  var globalGameData = {
    selectedCard: void 0,
    targetedEntities: []
  };
  function clearSelectedCard(card) {
    globalGameData.selectedCard = void 0;
    card == null ? void 0 : card.sprite.classList.remove("selected");
  }
  function clearTargeted(targets) {
    targets.forEach((el) => {
      el.classList.remove("targeted");
    });
  }
  function getValidTargets(entities, card) {
    if (card.data.a || card.data.aa || card.data.w || card.data.wa) {
      return entities.filter((entity) => entity.data.type === "enemy" /* enemy */);
    }
    return [entities.find((entity) => entity.data.type === "player" /* player */)];
  }
  function getEnemiesForLevel(c) {
    levels[c.level].enemies().forEach(((enemy) => {
      const e = new Enemy(c.modifiedEnemyData[enemy], c);
      c.enemies.push(e);
    }));
  }
  var difficultyNames = ["Normal", "Challenging", "Really Hard", "Maybe Impossible", "Probably Impossible"];
  var Game = class {
    constructor(e, gameData) {
      this.onRestart = () => void 0;
      globalGameData.selectedCard = void 0;
      globalGameData.targetedEntities = [];
      this.deck = (gameData == null ? void 0 : gameData.deck) || new Deck(this);
      if (gameData == null ? void 0 : gameData.deck) this.deck.register(this);
      this.e = e;
      this.level = data_default.startLevel;
      this.turn = data_default.startTurn;
      this.enemies = [];
      this.player = new Player(data_default.playerData, this);
      this.state = "player_turn" /* PLAYER_TURN */;
      this.diffMult = 1;
      this.modifiedEnemyData = data_default.enemyData;
    }
    setState(newState) {
      this.state = newState;
    }
    alert(str, hint = false) {
      const id = uuid();
      const el = gei("alert");
      el.setAttribute("data-id", id);
      el.innerHTML = str;
      el.classList.toggle("hint", hint);
      el.classList.toggle("show", !!str);
      setTimeout(() => {
        if (gei("alert").getAttribute("data-id") === id) {
          gei("alert").innerHTML = "";
          gei("alert").classList.remove("show");
        }
      }, hint ? 3e3 : 2500);
    }
    renderDeck() {
      const el = gei("deckdisplay");
      const grid = gei("deckgrid");
      if (el.classList.contains("hide")) {
        sounds_default.buttonInteract();
        grid.innerHTML = "";
        this.deck.deck.forEach((card) => {
          const copy = cardElementBuilder(card);
          copy.removeAttribute("id");
          grid.appendChild(copy);
        });
        gei("decktitle").innerHTML = `Your deck: ${this.deck.deck.length} cards`;
        el.classList.remove("hide");
      } else {
        el.classList.add("hide");
        grid.innerHTML = "";
      }
    }
    newGame() {
      this.diffMult = globals.difficulty;
      this.modifiedEnemyData = getEnemyDataWithMult(this.diffMult);
      this.e.title.classList.add("hide");
      this.e.game.classList.remove("hide");
      getEnemiesForLevel(this);
      this.deck.shuffle();
      this.render();
      this.newTurn();
    }
    // Waiting on deck.pickNewCards...
    endRound() {
      this.deck.endRound();
      gei("endturn").disabled = true;
      this.setState("TRANSITION" /* TRANSITION */);
      clearSelectedCard(globalGameData.selectedCard);
      clearTargeted(globalGameData.targetedEntities);
      setTimeout(() => {
        this.setState("picking_card" /* PICKING_CARD */);
        gei("pickstage").innerHTML = `Stage ${this.level} conquered!`;
        this.deck.pickNewCards();
      }, 1e3);
    }
    endGame(isWin = true) {
      setTimeout(() => {
        const summary = isWin ? `<p class="result">Victory on ${difficultyNames[this.diffMult - 1]} difficulty!</p>` : `<p class="result">You fell on stage ${this.level} of ${Object.keys(levels).length}.</p>`;
        showMessage(summary + (isWin ? messages.final : messages.fail), () => {
          showMessage(messages.thanks, () => {
            this.onRestart();
          }, false, "Play again");
        }, true);
      }, 1e3);
    }
    newCardPicked() {
      sounds_default.buttonInteract();
      this.deck.clearHand();
      this.player.applyInnate(this.deck.innatePile, "buff" /* buff */);
      setTimeout(() => {
        this.newRound();
      }, 500);
    }
    newRound() {
      this.level += 1;
      this.turn = 0;
      getEnemiesForLevel(this);
      this.player.applyInnate(this.deck.innatePile, "round" /* round */);
      setTimeout(() => {
        this.player.startRound();
        this.deck.shuffle();
        this.render();
        this.newTurn();
      }, 500);
    }
    newTurn() {
      this.turn += 1;
      this.setState("player_turn" /* PLAYER_TURN */);
      gei("endturn").disabled = false;
      this.player.startTurn();
      this.player.applyInnate(this.deck.innatePile, "turn" /* turn */);
      this.update();
      this.enemies.forEach((enemy) => {
        enemy.pickAction();
      });
      this.deck.startDraw(data_default.defaultDraw);
    }
    render() {
      this.enemies.forEach((entity) => {
        entity.render();
      });
      this.player.render();
      gei("stage").innerHTML = `Stage ${this.level} / ${Object.keys(levels).length}`;
      this.update();
    }
    update() {
      gei("stamina").innerHTML = `<span>Stamina</span> ${this.player.currentStamina}`;
      gei("round").innerHTML = `Turn ${this.turn}`;
      const canPlay = this.state === "player_turn" /* PLAYER_TURN */ && this.deck.handPile.some((card) => (card.data.c || 0) <= this.player.currentStamina);
      gei("endturn").classList.toggle("suggest", this.state === "player_turn" /* PLAYER_TURN */ && !canPlay);
      this.deck.handPile.forEach((card) => {
        card.sprite.classList.toggle("unaffordable", this.state === "player_turn" /* PLAYER_TURN */ && (card.data.c || 0) > this.player.currentStamina);
      });
    }
    onPlayerBuffsApplied(cards2) {
      this.deck.removeInnateBuffs(cards2);
    }
    /**
     * Called when a card is clicked in the hand during players turn. Card may have been
     * either Selected or De-selected. Targets are selected based on card data.
     * 
     * @param card 
     * @returns 
     */
    onPlayerSelectCard(card) {
      var _a;
      if (this.state !== "player_turn" /* PLAYER_TURN */) return;
      clearTargeted(globalGameData.targetedEntities);
      sounds_default.cardSelect();
      globalGameData.targetedEntities = [];
      if (this.player.currentStamina < card.data.c) {
        flashCardCost(card);
        this.alert("Not enough stamina!");
        return;
      }
      if (((_a = globalGameData.selectedCard) == null ? void 0 : _a.id) !== card.id) {
        clearSelectedCard(globalGameData.selectedCard);
        globalGameData.selectedCard = card;
        card.sprite.classList.add("selected");
      } else {
        clearSelectedCard(globalGameData.selectedCard);
        this.alert("", true);
        return;
      }
      const targets = getValidTargets([...this.enemies, this.player], card);
      targets.forEach((entity) => {
        const el = entity.sprite;
        globalGameData.targetedEntities.push(el);
        el.classList.add("targeted");
      });
      const targetsEnemy = targets[0] !== this.player;
      const allEnemies = card.data.aa || card.data.wa;
      this.alert(targetsEnemy ? allEnemies ? "Tap any enemy to hit them all" : "Tap an enemy to target it" : "Tap the Khan to use this card", true);
    }
    /**
     * Called when an entity is selected during combat.
     * 
     * *should not* be called if player stamina is insufficient for played card
     * 
     * @param id id of selected entity
     */
    entitySelect(id) {
      var _a, _b;
      if (globalGameData.selectedCard && this.state === "player_turn" /* PLAYER_TURN */) {
        this.alert("", true);
        const target = getValidTargets([...this.enemies, this.player], globalGameData.selectedCard).find((item) => (item == null ? void 0 : item.id) === id);
        if (!target || this.player.currentStamina < ((_b = (_a = globalGameData.selectedCard) == null ? void 0 : _a.data) == null ? void 0 : _b.c)) {
          return;
        }
        const cardToRemove = globalGameData.selectedCard;
        clearSelectedCard(globalGameData.selectedCard);
        clearTargeted(globalGameData.targetedEntities);
        this.player.play(cardToRemove);
        this.player.do(cardToRemove.type);
        const dynamicData = cardToRemove.dData(this.player.data);
        if (target && target !== this.player) {
          target.applyFromEnemy(dynamicData);
        }
        this.player.applyFromFriendly(dynamicData);
        this.deck.updateVisibleCards(this.player.data);
        this.update();
        this.deck.removeFromHand(cardToRemove);
        if (!this.enemies.length) {
          if (this.level === Object.keys(levels).length) {
            this.setState("game_over" /* GAME_OVER */);
            this.endGame();
          } else {
            this.endRound();
          }
        }
      }
    }
    applyToAllEnemies(cardData) {
      [...this.enemies].forEach((enemy) => {
        enemy.applyFromEnemy(cardData);
      });
    }
    endPlayerTurn() {
      if (this.state === "player_turn" /* PLAYER_TURN */) {
        sounds_default.buttonInteract();
        this.setState("enemy_turn" /* ENEMY_TURN */);
        gei("endturn").disabled = true;
        this.player.endTurn();
        clearSelectedCard(globalGameData.selectedCard);
        clearTargeted(globalGameData.targetedEntities);
        this.enemies.forEach((enemy) => {
          enemy.startTurn();
        });
        this.deck.endTurn();
        this.update();
        setTimeout(() => this.runEnemyTurns(), 1e3);
      }
    }
    runEnemyTurns() {
      const enemiesToGo = [...this.enemies];
      const enemyTurn = () => {
        const enemy = enemiesToGo.pop();
        if (enemy) {
          const dynamicData = enemy.nextAction.dData(enemy.data);
          this.player.applyFromEnemy(dynamicData);
          enemy.applyFromFriendly(dynamicData);
          enemy.do(enemy.nextAction.type);
          setTimeout(() => enemyTurn(), 1e3);
        } else {
          this.startNextTurn();
        }
      };
      enemyTurn();
    }
    startNextTurn() {
      if (this.state !== "game_over" /* GAME_OVER */) {
        this.enemies.forEach((enemy) => {
          enemy.endTurn();
        });
        this.newTurn();
      }
    }
    onDeath(entity) {
      entity.sprite.style.animationName = "dead";
      setTimeout(() => {
        var _a;
        (_a = entity.sprite.parentNode) == null ? void 0 : _a.removeChild(entity.sprite);
      }, 750);
      if (entity.isPlayer) {
        this.setState("game_over" /* GAME_OVER */);
        this.endGame(false);
        return;
      }
      this.enemies.splice(this.enemies.indexOf(entity), 1);
    }
  };

  // src/p1.ts
  var createP1 = function() {
    var buffers = {}, tracks = [], trackLen = 0, tempo = 125, interval, noteI = 0, b = (note, add) => Math.sin(note * 6.28 + add), pianoify = (note) => b(note, b(note, 0) ** 2 + b(note, 0.25) * 0.75 + b(note, 0.5) * 0.1);
    var makeNote = (note, seconds, sampleRate) => {
      var key = note + "" + seconds;
      var buffer = buffers[key];
      if (note >= 0 && !buffer) {
        note = 65.406 * 1.06 ** note / sampleRate;
        var i = sampleRate * seconds | 0, sampleRest = sampleRate * (seconds - 2e-3), bufferArray;
        buffer = buffers[key] = getAudioContext().createBuffer(1, i, sampleRate);
        bufferArray = buffer.getChannelData(0);
        for (; i--; ) {
          bufferArray[i] = // The first 88 samples represent the note's attack
          (i < 88 ? i / 88.2 : (1 - (i - 88.2) / sampleRest) ** (Math.log(1e4 * note) / 2) ** 2) * pianoify(i * note);
        }
      }
      return buffer;
    };
    var playBuffer = (buffer) => {
      var context = getAudioContext();
      if (!context || context.state !== "running") return;
      var gain = context.createGain();
      gain.gain.value = 0.1;
      gain.connect(context.destination);
      var source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.start();
    };
    var tick = () => {
      tracks.map((track) => {
        var j = noteI % track.length;
        if (track[j]) playBuffer(track[j]);
      });
      noteI++;
      noteI %= trackLen;
    };
    var startInterval = () => {
      clearInterval(interval);
      if (tracks.length && trackLen) interval = setInterval(tick, tempo);
    };
    return {
      play(song) {
        if (!getAudioContext()) return;
        var noteLen = 0.5;
        tempo = 125;
        trackLen = 0;
        tracks = song.replace(/[\!\|]/g, "").split("\n").filter((track) => track.trim()).map(
          (track) => track > 0 ? (track = track.split("."), tempo = Number(track[0]), noteLen = track[1] / 100 || noteLen, null) : track.split("").map((letter, i) => {
            var duration = 1, note = letter.charCodeAt(0);
            note -= note > 90 ? 71 : 65;
            while (track[i + duration] == "-") {
              duration++;
            }
            if (trackLen < i) trackLen = i + 1;
            return makeNote(note, duration * noteLen * tempo / 125, 44100);
          })
        ).filter((track) => track);
        noteI = 0;
        startInterval();
      },
      stop() {
        clearInterval(interval);
        interval = void 0;
        tracks = [];
      },
      pause() {
        clearInterval(interval);
        interval = void 0;
      },
      resume() {
        if (!interval) startInterval();
      }
    };
  };

  // src/layout.ts
  var TOP_H = 64;
  var SIDE_W = 150;
  var INTENT_H = 34;
  var STATS_H = 46;
  var current = { portrait: false, singleRow: false, W: 820, H: 430, cw: 110, ch: 150 };
  function layout() {
    const board = gei("board");
    const app = gei("app");
    const vw = Math.max(1, app.clientWidth || window.innerWidth);
    const vh = Math.max(1, app.clientHeight || window.innerHeight);
    const portrait = vw / vh < 0.95;
    const [bw, bh] = portrait ? [420, 700] : [820, 430];
    let s = Math.min(vw / bw, vh / bh);
    if (s > 1.5) s = 1.5 + (s - 1.5) * 0.55;
    const W = vw / s;
    const H = vh / s;
    board.style.width = W + "px";
    board.style.height = H + "px";
    board.style.transform = `scale(${s})`;
    board.dataset.scale = String(s);
    board.classList.toggle("portrait", portrait);
    board.classList.toggle("landscape", !portrait);
    let singleRow = false;
    let cw, ch, handH, statusH, k, groundTop;
    if (!portrait) {
      statusH = 0;
      ch = Math.round(Math.max(128, Math.min(250, H * 0.34)));
      cw = Math.round(ch * 0.72);
      handH = ch + 28;
      const bfH = H - TOP_H - statusH - handH;
      const kh = Math.floor((bfH - INTENT_H - STATS_H - 8) / 20);
      const kw = Math.floor((W * 0.6 - 60) / 68);
      k = Math.max(2, Math.min(9, kh, kw));
      groundTop = TOP_H + bfH - STATS_H - 6;
    } else {
      statusH = 60;
      singleRow = H / W < 1.75;
      if (singleRow) {
        ch = Math.round(Math.max(120, Math.min(230, H * 0.24, (W - 56) / 5 / 0.72)));
        cw = Math.round(ch * 0.72);
        handH = ch + 30;
      } else {
        cw = Math.floor((W - 24) / 4 - 8);
        ch = Math.round(cw / 0.72);
        const maxCh = Math.floor((H * 0.4 - 30) / 2);
        if (ch > maxCh) {
          ch = maxCh;
          cw = Math.round(ch * 0.72);
        }
        handH = ch * 2 + 8 + 30;
      }
      const bfH = H - TOP_H - statusH - handH;
      const rowH = bfH / 2;
      const kh = Math.floor((rowH - INTENT_H - STATS_H - 6) / 20);
      const kw = Math.floor((W - 40) / 72);
      k = Math.max(2, Math.min(9, kh, kw));
      groundTop = TOP_H + rowH - STATS_H - 4;
    }
    const vars = {
      "--top-h": TOP_H + "px",
      "--status-h": statusH + "px",
      "--hand-h": handH + "px",
      "--cw": cw + "px",
      "--ch": ch + "px",
      "--k": String(k),
      "--ground-top": groundTop + "px"
    };
    Object.keys(vars).forEach((key) => board.style.setProperty(key, vars[key]));
    board.classList.toggle("cards-lg", ch >= 165);
    board.classList.toggle("hand-row", !portrait || singleRow);
    current = { portrait, singleRow, W, H, cw, ch };
    layoutHand();
  }
  function layoutHand() {
    const holder = gei("card-holder");
    const n = holder.children.length;
    const { portrait, singleRow, W, cw } = current;
    if (portrait && !singleRow) {
      const perRow = n <= 4 ? Math.max(1, n) : Math.ceil(n / 2);
      holder.style.setProperty("--gap", "8px");
      holder.style.maxWidth = perRow * (cw + 8) + "px";
    } else {
      const avail = W - 24 - (portrait ? 0 : SIDE_W);
      const gap = n > 1 ? Math.min(8, (avail - n * cw) / (n - 1)) : 0;
      holder.style.setProperty("--gap", gap + "px");
      holder.style.maxWidth = "";
    }
  }

  // src/index.ts
  var SONG = `50.25
    |C---H---|--------|        |J---A---|--------|        |F---E---|--------|        |H---F---|--------|        |A---C---|--------|        |E---C---|--------|        |F---J---|--------|        |C---F---|--------|     |`;
  var difficultyDescriptions = [
    "The intended challenge",
    "Enemy damage & defense +50%",
    "Enemy life, damage & defense +50%",
    "Enemy life, damage & defense +100%",
    "Enemy life, damage & defense +150%"
  ];
  window.addEventListener("load", () => {
    var _a;
    const player = createP1();
    const e = {
      board: gei("board"),
      title: gei("title"),
      game: gei("game"),
      new: gei("new"),
      endturn: gei("endturn"),
      music: gei("music"),
      sfx: gei("sfx"),
      tutorial: gei("tutorial"),
      gotit: gei("gotit"),
      viewdeck: gei("viewdeck")
    };
    let game = new Game(e);
    game.onRestart = restart;
    function restart() {
      ["enemy", "player", "card-holder"].forEach((id) => {
        gei(id).innerHTML = "";
      });
      gei("picker").classList.add("hide");
      gei("deckdisplay").classList.add("hide");
      gei("progress").classList.add("hide");
      e.game.classList.add("hide");
      e.title.classList.remove("hide");
      e.board.classList.add("on-title");
      game = new Game(e);
      game.onRestart = restart;
      layout();
    }
    const unlock = () => {
      unlockAudio();
      if (globals.music) player.resume();
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    function play2() {
      if (globals.music) return;
      if (!unlockAudio()) return;
      globals.music = true;
      e.music.classList.remove("stopped");
      player.play(SONG);
    }
    function stop() {
      globals.music = false;
      e.music.classList.add("stopped");
      player.stop();
    }
    e.music.classList.add("stopped");
    e.sfx.classList.toggle("stopped", !globals.sfx);
    function tutorial(show) {
      globals.tutorial = show;
      gei("helpbox").classList.toggle("hide", !show);
    }
    e.tutorial.addEventListener("click", () => {
      sounds_default.buttonInteract();
      tutorial(!globals.tutorial);
    });
    e.gotit.addEventListener("click", () => {
      tutorial(false);
    });
    e.new.addEventListener("click", () => {
      unlockAudio();
      sounds_default.buttonInteract();
      if (globals.musicWanted) play2();
      showMessage(messages.intro, () => {
        gei("progress").classList.remove("hide");
        e.board.classList.remove("on-title");
        game.newGame.call(game);
        layout();
      }, false, "To battle!");
    });
    e.endturn.addEventListener("click", () => game.endPlayerTurn());
    gei("confirmcard").addEventListener("click", () => game.deck.confirmAdd());
    e.music.addEventListener("click", () => {
      if (globals.music) {
        stop();
        globals.musicWanted = false;
      } else {
        globals.musicWanted = true;
        play2();
      }
      save("music", globals.musicWanted ? 1 : 0);
    });
    e.sfx.addEventListener("click", () => {
      globals.sfx = !globals.sfx;
      e.sfx.classList.toggle("stopped", !globals.sfx);
      save("sfx", globals.sfx ? 1 : 0);
      sounds_default.buttonInteract();
    });
    e.viewdeck.addEventListener("click", () => game.renderDeck());
    gei("deckdone").addEventListener("click", () => game.renderDeck());
    function showDifficulty() {
      gei("diff-name").innerHTML = difficultyNames[globals.difficulty - 1];
      gei("diff-desc").innerHTML = difficultyDescriptions[globals.difficulty - 1];
      gei("diff-prev").disabled = globals.difficulty <= 1;
      gei("diff-next").disabled = globals.difficulty >= 5;
    }
    function stepDifficulty(delta) {
      globals.difficulty = Math.min(5, Math.max(1, globals.difficulty + delta));
      save("difficulty", globals.difficulty);
      sounds_default.cardSelect();
      showDifficulty();
    }
    gei("diff-prev").addEventListener("click", () => stepDifficulty(-1));
    gei("diff-next").addEventListener("click", () => stepDifficulty(1));
    showDifficulty();
    const tip = gei("tooltip");
    let tipTimer = 0;
    function tipText(el) {
      if (el.classList.contains("intent")) {
        if (el.classList.contains("assault")) return `Planning to attack you for ${el.textContent}!`;
        if (el.classList.contains("defense")) return "Planning to defend itself!";
        if (el.classList.contains("ability")) return "Planning something unpleasant!";
        return "";
      }
      const n = parseInt((el.textContent || "").replace(/\D/g, "")) || 0;
      if (el.classList.contains("armor")) return `Defend ${n}: blocks ${n} attack damage until the next turn.`;
      if (el.classList.contains("enrage")) return `Enrage ${n}: deals 50% more damage for ${n} turn${n === 1 ? "" : "s"}.`;
      if (el.classList.contains("weak")) return `Weaken ${n}: 25% less damage and 50% less defense for ${n} turn${n === 1 ? "" : "s"}.`;
      return "";
    }
    function showTip(el) {
      const text = tipText(el);
      if (!text) return hideTip();
      const scale = Number(e.board.dataset.scale) || 1;
      const br = e.board.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      tip.innerHTML = text;
      tip.classList.remove("hide");
      const bw = e.board.offsetWidth;
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const cx = (r.left + r.width / 2 - br.left) / scale;
      let top = (r.top - br.top) / scale - th - 8;
      if (top < 4) top = (r.bottom - br.top) / scale + 8;
      tip.style.left = Math.max(6, Math.min(bw - tw - 6, cx - tw / 2)) + "px";
      tip.style.top = top + "px";
      clearTimeout(tipTimer);
      tipTimer = window.setTimeout(hideTip, 3500);
    }
    function hideTip() {
      tip.classList.add("hide");
    }
    const TIP_SELECTOR = ".intent, .affects .armor, .affects .enrage, .affects .weak";
    e.board.addEventListener("pointerover", (ev) => {
      if (ev.pointerType !== "mouse") return;
      const el = ev.target.closest(TIP_SELECTOR);
      el ? showTip(el) : hideTip();
    });
    e.board.addEventListener("pointerdown", (ev) => {
      if (ev.pointerType === "mouse") return;
      const el = ev.target.closest(TIP_SELECTOR);
      el ? showTip(el) : hideTip();
    });
    e.board.addEventListener("contextmenu", (ev) => ev.preventDefault());
    document.addEventListener("dblclick", (ev) => ev.preventDefault());
    document.addEventListener("visibilitychange", () => {
      const ctx2 = getAudioContext();
      if (document.hidden) {
        player.pause();
        ctx2 == null ? void 0 : ctx2.suspend().catch(() => void 0);
      } else {
        ctx2 == null ? void 0 : ctx2.resume().catch(() => void 0);
        if (globals.music) player.resume();
      }
    });
    const app = gei("app");
    app.addEventListener("scroll", () => {
      app.scrollLeft = 0;
      app.scrollTop = 0;
    });
    new MutationObserver(() => layoutHand()).observe(gei("card-holder"), { childList: true });
    window.addEventListener("resize", layout);
    window.addEventListener("orientationchange", () => setTimeout(layout, 100));
    (_a = window.visualViewport) == null ? void 0 : _a.addEventListener("resize", layout);
    layout();
  });
})();
