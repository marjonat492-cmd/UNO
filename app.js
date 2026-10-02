const COLORS = ["red", "yellow", "green", "blue"];
const ACTIONS = ["skip", "reverse", "draw2"];

const state = {
  players: [],
  deck: [],
  discard: [],
  activePlayer: 0,
  direction: 1,
  currentColor: "red",
  currentValue: "0",
  winner: null,
  gameStarted: false,
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeCard(color, value, type = "normal") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    color,
    value,
    type,
  };
}

function createDeck() {
  const deck = [];

  COLORS.forEach((color) => {
    deck.push(makeCard(color, "0", "number"));

    for (let value = 1; value <= 9; value += 1) {
      deck.push(makeCard(color, String(value), "number"));
      deck.push(makeCard(color, String(value), "number"));
    }

    ACTIONS.forEach((action) => {
      deck.push(makeCard(color, action, "action"));
      deck.push(makeCard(color, action, "action"));
    });
  });

  for (let i = 0; i < 4; i += 1) {
    deck.push(makeCard(null, "wild", "wild"));
    deck.push(makeCard(null, "wild4", "wild"));
  }

  return shuffle(deck);
}

function drawCardFromDeck() {
  if (state.deck.length === 0) {
    const last = state.discard.pop();
    const rest = state.discard;
    state.deck = shuffle(rest);
    state.discard = [last];
  }

  return state.deck.pop();
}

function getNextIndex(startIndex, steps = 1) {
  let index = startIndex;

  for (let i = 0; i < steps; i += 1) {
    index = (index + state.direction + state.players.length) % state.players.length;
  }

  return index;
}

function isPlayable(card) {
  if (!card) return false;
  if (card.color === "wild") return true;
  if (card.color === state.currentColor) return true;
  if (card.value === state.currentValue) return true;
  return false;
}

function cardLabel(card) {
  if (!card) return "";
  if (card.value === "wild") return "W";
  if (card.value === "wild4") return "+4";
  if (card.value === "draw2") return "+2";
  if (card.value === "reverse") return "↻";
  if (card.value === "skip") return "⊘";
  return card.value;
}

function setStatus(message) {
  const statusField = document.getElementById("status");
  statusField.textContent = message;
}

function renderPlayers() {
  const playersField = document.getElementById("players");
  playersField.innerHTML = "";

  state.players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = `player-item ${index === state.activePlayer ? "active" : ""}`;
    item.innerHTML = `
      <div class="player-name">${player.name}</div>
      <div class="player-count">${player.hand.length} ta karta</div>
    `;
    playersField.appendChild(item);
  });
}

function renderDiscard() {
  const discardField = document.getElementById("discard-pile");
  const topCard = state.discard[state.discard.length - 1];

  discardField.innerHTML = "";

  if (!topCard) {
    return;
  }

  const cardEl = document.createElement("div");
  cardEl.className = "discard-card";
  cardEl.dataset.color = topCard.color || "wild";
  cardEl.textContent = cardLabel(topCard);
  discardField.appendChild(cardEl);
}

function renderHand() {
  const handField = document.getElementById("player-hand");
  handField.innerHTML = "";

  if (!state.players[0]) {
    return;
  }

  state.players[0].hand.forEach((card, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `card-btn ${isPlayable(card) ? "selectable" : ""}`;
    btn.dataset.color = card.color || "wild";
    btn.textContent = cardLabel(card);
    btn.title = `${card.color || "wild"} ${card.value}`;

    if (state.activePlayer !== 0 || !state.gameStarted || state.winner) {
      btn.disabled = true;
    }

    btn.addEventListener("click", () => {
      if (state.activePlayer !== 0 || !state.gameStarted) return;
      if (!isPlayable(card)) return;

      if (card.value === "wild" || card.value === "wild4") {
        openColorPicker((chosenColor) => playCard(0, index, chosenColor));
      } else {
        playCard(0, index);
      }
    });

    handField.appendChild(btn);
  });
}

function renderGame() {
  renderPlayers();
  renderDiscard();
  renderHand();
  document.getElementById("deck-count").textContent = String(state.deck.length);

  if (state.winner) {
    setStatus(`${state.winner} g'olib bo'ldi!`);
    return;
  }

  if (!state.gameStarted) {
    setStatus("Boshlash uchun 'Yangi o'yin' tugmasini bosing.");
    return;
  }

  if (state.activePlayer === 0) {
    setStatus("Sizning navbatingiz. Rang yoki raqamni moslang, yoxud maxsus karta tashlang.");
  } else {
    setStatus(`${state.players[state.activePlayer].name} o'ynamoqda...`);
  }
}

function playCard(playerIndex, handIndex, chosenColor = null) {
  const player = state.players[playerIndex];
  const card = player.hand.splice(handIndex, 1)[0];

  if (!card) {
    return;
  }

  state.discard.push(card);

  if (card.value === "wild" || card.value === "wild4") {
    state.currentColor = chosenColor || "red";
    state.currentValue = card.value;
  } else {
    state.currentColor = card.color;
    state.currentValue = card.value;
  }

  if (card.value === "reverse") {
    if (state.players.length === 2) {
      const skipTarget = getNextIndex(playerIndex, 2);
      state.activePlayer = skipTarget;
    } else {
      state.direction *= -1;
      state.activePlayer = getNextIndex(playerIndex, 1);
    }
  } else if (card.value === "skip") {
    state.activePlayer = getNextIndex(playerIndex, 2);
  } else if (card.value === "draw2") {
    const target = getNextIndex(playerIndex, 1);
    for (let i = 0; i < 2; i += 1) {
      state.players[target].hand.push(drawCardFromDeck());
    }
    state.activePlayer = getNextIndex(target, 1);
  } else if (card.value === "wild4") {
    const target = getNextIndex(playerIndex, 1);
    for (let i = 0; i < 4; i += 1) {
      state.players[target].hand.push(drawCardFromDeck());
    }
    state.activePlayer = getNextIndex(target, 1);
  } else {
    state.activePlayer = getNextIndex(playerIndex, 1);
  }

  if (player.hand.length === 0) {
    state.winner = player.name;
  }

  renderGame();

  if (state.winner) {
    return;
  }

  if (state.activePlayer !== 0) {
    setTimeout(cpuTurn, 650);
  }
}

function openColorPicker(callback) {
  const picker = document.getElementById("color-picker");
  picker.classList.remove("hidden");

  picker.querySelectorAll(".color-option").forEach((button) => {
    button.onclick = () => {
      picker.classList.add("hidden");
      callback(button.dataset.color);
    };
  });
}

function chooseCpuColor(cpu) {
  const counts = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  };

  cpu.hand.forEach((card) => {
    if (card.color && counts[card.color] !== undefined) {
      counts[card.color] += 1;
    }
  });

  const bestColor = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return bestColor ? bestColor[0] : "red";
}

function cpuTurn() {
  if (!state.gameStarted || state.winner || state.activePlayer === 0) {
    return;
  }

  const cpu = state.players[state.activePlayer];
  const playableCards = cpu.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => isPlayable(card));

  if (playableCards.length === 0) {
    cpu.hand.push(drawCardFromDeck());
    renderGame();

    const lastCard = cpu.hand[cpu.hand.length - 1];
    if (lastCard && isPlayable(lastCard)) {
      const lastIndex = cpu.hand.length - 1;
      const chosenColor = lastCard.color === "wild" || lastCard.value === "wild4"
        ? chooseCpuColor(cpu)
        : null;
      setTimeout(() => {
        if (lastCard.value === "wild" || lastCard.value === "wild4") {
          playCard(state.activePlayer, lastIndex, chosenColor);
        } else {
          playCard(state.activePlayer, lastIndex);
        }
      }, 400);
      return;
    }

    setTimeout(() => {
      state.activePlayer = getNextIndex(state.activePlayer, 1);
      renderGame();
      if (state.activePlayer !== 0) {
        cpuTurn();
      }
    }, 500);
    return;
  }

  const bestChoice = playableCards.find(({ card }) => (
    card.value === "wild" || card.value === "wild4" || card.value === "draw2" || card.value === "skip" || card.value === "reverse"
  )) || playableCards[0];

  if (!bestChoice) {
    return;
  }

  const chosenColor = bestChoice.card.color === "wild" || bestChoice.card.value === "wild4"
    ? chooseCpuColor(cpu)
    : null;

  setTimeout(() => {
    playCard(state.activePlayer, bestChoice.index, chosenColor);
  }, 500);
}

function startGame() {
  const playerCount = 2;

  state.players = Array.from({ length: playerCount }, (_, index) => ({
    name: index === 0 ? "Siz" : "Kompyuter",
    hand: [],
  }));

  state.deck = createDeck();
  state.discard = [];
  state.activePlayer = 0;
  state.direction = 1;
  state.currentColor = "red";
  state.currentValue = "0";
  state.winner = null;
  state.gameStarted = true;

  state.players.forEach((player) => {
    for (let i = 0; i < 7; i += 1) {
      player.hand.push(drawCardFromDeck());
    }
  });

  let starter = drawCardFromDeck();
  while (starter && (starter.color === null || starter.value === "wild" || starter.value === "wild4")) {
    state.deck.unshift(starter);
    starter = drawCardFromDeck();
  }

  if (starter) {
    state.discard.push(starter);
    state.currentColor = starter.color;
    state.currentValue = starter.value;
  }

  renderGame();

  if (state.activePlayer !== 0) {
    cpuTurn();
  }
}

document.getElementById("new-game").addEventListener("click", startGame);
document.getElementById("draw-btn").addEventListener("click", () => {
  if (!state.gameStarted || state.activePlayer !== 0 || state.winner) {
    return;
  }

  const drawn = drawCardFromDeck();
  state.players[0].hand.push(drawn);
  renderGame();

  if (drawn && isPlayable(drawn)) {
    setStatus("Tashlash mumkin bo'lgan karta oldingiz. Uni qo'lingizdan tanlang.");
  } else {
    state.activePlayer = getNextIndex(state.activePlayer, 1);
    renderGame();
    if (state.activePlayer !== 0) {
      setTimeout(cpuTurn, 600);
    }
  }
});

startGame();
