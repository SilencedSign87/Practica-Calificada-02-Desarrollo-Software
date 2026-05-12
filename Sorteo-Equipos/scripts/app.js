const STORAGE_KEY = "team-draw-participants";

const setupScreen = document.getElementById("setupScreen");
const resultScreen = document.getElementById("resultScreen");
const participantsInput = document.getElementById("participants");
const participantCount = document.getElementById("participantCount");
const participantsError = document.getElementById("participantsError");
const splitValue = document.getElementById("splitValue");
const teamTitle = document.getElementById("teamTitle");
const clearBtn = document.getElementById("clearBtn");
const generateBtn = document.getElementById("generateBtn");
const backBtn = document.getElementById("backBtn");
const finalTitle = document.getElementById("finalTitle");
const teamsGrid = document.getElementById("teamsGrid");
const downloadBtn = document.getElementById("downloadBtn");
const copyImageBtn = document.getElementById("copyImageBtn");
const copyColumnsBtn = document.getElementById("copyColumnsBtn");
const actionMessage = document.getElementById("actionMessage");

let currentTeams = [];
let leftoverParticipants = [];
let revealTimer = null;
let currentMode = "teams";
const splitSelections = {
  teams: "2",
  members: "1"
};

participantsInput.value = localStorage.getItem(STORAGE_KEY) || "";
updateParticipantState();
fillSplitOptions();

participantsInput.addEventListener("input", () => {
  localStorage.setItem(STORAGE_KEY, participantsInput.value);
  updateParticipantState();
  fillSplitOptions();
});

document.querySelectorAll("input[name='splitMode']").forEach((input) => {
  input.addEventListener("change", () => {
    splitSelections[currentMode] = splitValue.value;
    currentMode = input.value;
    fillSplitOptions();
  });
});

splitValue.addEventListener("change", () => {
  splitSelections[getMode()] = splitValue.value;
});

clearBtn.addEventListener("click", () => {
  participantsInput.value = "";
  teamTitle.value = "";
  localStorage.removeItem(STORAGE_KEY);
  updateParticipantState();
  fillSplitOptions();
  participantsInput.focus();
});

generateBtn.addEventListener("click", generateTeams);
backBtn.addEventListener("click", showSetup);
downloadBtn.addEventListener("click", downloadJpg);
copyImageBtn.addEventListener("click", copyImageToClipboard);
copyColumnsBtn.addEventListener("click", copyColumnsToClipboard);

function getMode() {
  const checkedInput = document.querySelector("input[name='splitMode']:checked");
  currentMode = checkedInput ? checkedInput.value : currentMode;
  return currentMode;
}

function getParticipants() {
  return participantsInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({
      name: name.replace(/^\*\s*/, "").trim(),
      leader: name.startsWith("*")
    }))
    .filter((participant) => participant.name.length > 0);
}

function validateParticipants() {
  const participants = getParticipants();
  const longName = participants.find((participant) => participant.name.length > 50);

  if (participants.length === 0) {
    return "Ingresa al menos un participante.";
  }

  if (participants.length > 100) {
    return "El maximo permitido es 100 participantes.";
  }

  if (longName) {
    return `El nombre "${longName.name}" supera los 50 caracteres.`;
  }

  return "";
}

function updateParticipantState() {
  const participants = getParticipants();
  participantCount.textContent = participants.length;
  participantsError.textContent = validateParticipants();
}

function fillSplitOptions() {
  const participantsTotal = getParticipants().length;
  const mode = getMode();
  const selectedValue = splitSelections[mode];
  splitValue.innerHTML = "";

  const max = mode === "teams" ? Math.max(2, Math.min(100, participantsTotal || 100)) : Math.max(1, Math.min(100, participantsTotal || 100));
  const min = mode === "teams" ? 2 : 1;

  for (let value = min; value <= max; value += 1) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = mode === "teams" ? `${value} equipos` : `${value} participantes por equipo`;
    splitValue.appendChild(option);
  }

  if ([...splitValue.options].some((option) => option.value === selectedValue)) {
    splitValue.value = selectedValue;
  } else if (splitValue.options.length > 0) {
    splitValue.value = splitValue.options[splitValue.options.length - 1].value;
  }

  splitSelections[mode] = splitValue.value;
}

function generateTeams() {
  const error = validateParticipants();
  if (error) {
    participantsError.textContent = error;
    participantsInput.focus();
    return;
  }

  const participants = shuffle(getParticipants());
  const selectedValue = Number.parseInt(splitValue.value, 10);
  const mode = getMode();
  const valueError = validateSplitValue(participants.length, mode, selectedValue);
  if (valueError) {
    participantsError.textContent = valueError;
    return;
  }

  splitSelections[mode] = String(selectedValue);
  const distribution = createTeamDistribution(participants, mode, selectedValue);
  currentTeams = distribution.teams;
  leftoverParticipants = distribution.leftovers;

  showResults();
  renderEmptyTeams();
  revealMembers();
}

function calculateTeamCount(totalParticipants, mode, selectedValue) {
  if (mode === "teams") {
    return selectedValue;
  }

  return Math.floor(totalParticipants / selectedValue);
}

function createTeamDistribution(participants, mode, selectedValue) {
  const teamCount = calculateTeamCount(participants.length, mode, selectedValue);
  const membersPerTeam = mode === "teams" ? Math.floor(participants.length / selectedValue) : selectedValue;
  const teams = Array.from({ length: teamCount }, () => []);
  const leftovers = [];

  participants.forEach((participant, index) => {
    if (index < teamCount * membersPerTeam) {
      teams[Math.floor(index / membersPerTeam)].push(participant);
      return;
    }

    leftovers.push(participant);
  });

  return { teams, leftovers };
}

function validateSplitValue(totalParticipants, mode, selectedValue) {
  if (!Number.isInteger(selectedValue)) {
    return "Selecciona una cantidad valida para el sorteo.";
  }

  if (mode === "teams" && (selectedValue < 2 || selectedValue > totalParticipants)) {
    return `La cantidad de equipos debe estar entre 2 y ${totalParticipants}.`;
  }

  if (mode === "members" && (selectedValue < 1 || selectedValue > totalParticipants)) {
    return `Los participantes por equipo deben estar entre 1 y ${totalParticipants}.`;
  }

  return "";
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function showResults() {
  setupScreen.classList.remove("screen--active");
  resultScreen.classList.add("screen--active");
  finalTitle.textContent = teamTitle.value.trim() || "Equipos generados";
  actionMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSetup() {
  if (revealTimer) {
    clearInterval(revealTimer);
    revealTimer = null;
  }
  resultScreen.classList.remove("screen--active");
  setupScreen.classList.add("screen--active");
}

function renderEmptyTeams() {
  teamsGrid.innerHTML = "";
  currentTeams.forEach((team, index) => {
    const card = document.createElement("article");
    card.className = "team-card";
    card.innerHTML = `
      <h4>Equipo ${index + 1}</h4>
      <ul class="member-list" data-team="${index}"></ul>
    `;
    teamsGrid.appendChild(card);
  });

  if (leftoverParticipants.length > 0) {
    const card = document.createElement("article");
    card.className = "team-card team-card--leftovers";
    card.innerHTML = `
      <h4>Sobrantes</h4>
      <ul class="member-list" data-team="leftovers"></ul>
    `;
    teamsGrid.appendChild(card);
  }
}

function revealMembers() {
  const visibleGroups = leftoverParticipants.length > 0 ? [...currentTeams, leftoverParticipants] : currentTeams;
  const maxMembers = Math.max(...visibleGroups.map((team) => team.length));
  let memberIndex = 0;
  let teamIndex = 0;

  if (revealTimer) {
    clearInterval(revealTimer);
  }

  revealTimer = setInterval(() => {
    if (memberIndex >= maxMembers) {
      clearInterval(revealTimer);
      revealTimer = null;
      return;
    }

    const member = visibleGroups[teamIndex][memberIndex];
    if (member) {
      addMember(teamIndex < currentTeams.length ? teamIndex : "leftovers", member);
    }

    teamIndex += 1;
    if (teamIndex >= visibleGroups.length) {
      teamIndex = 0;
      memberIndex += 1;
    }
  }, 280);
}

function addMember(teamIndex, member) {
  const list = teamsGrid.querySelector(`[data-team="${teamIndex}"]`);
  const item = document.createElement("li");
  item.className = member.leader ? "member member--leader" : "member";
  item.textContent = member.leader ? `* ${member.name}` : member.name;
  list.appendChild(item);
}

async function downloadJpg() {
  const canvas = await createResultCanvas();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.94));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "equipos-generados.jpg";
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage("Imagen descargada.");
}

async function copyImageToClipboard() {
  try {
    const canvas = await createResultCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    showMessage("Imagen copiada al portapapeles.");
  } catch (error) {
    await navigator.clipboard.writeText(getPlainTextTeams());
    showMessage("Tu navegador copio los equipos como texto.");
  }
}

async function copyColumnsToClipboard() {
  await navigator.clipboard.writeText(getColumnTextTeams());
  showMessage("Columnas copiadas al portapapeles.");
}

function getPlainTextTeams() {
  const regularTeams = currentTeams
    .map((team, index) => {
      const members = team.map((member) => `${member.leader ? "* " : ""}${member.name}`).join("\n");
      return `Equipo ${index + 1}\n${members}`;
    })
    .join("\n\n");

  if (leftoverParticipants.length === 0) {
    return regularTeams;
  }

  const leftovers = leftoverParticipants.map((member) => `${member.leader ? "* " : ""}${member.name}`).join("\n");
  return `${regularTeams}\n\nSobrantes\n${leftovers}`;
}

function getColumnTextTeams() {
  const groups = leftoverParticipants.length > 0 ? [...currentTeams, leftoverParticipants] : currentTeams;
  const maxRows = Math.max(...groups.map((team) => team.length));
  const headers = groups.map((team, index) => index < currentTeams.length ? `Equipo ${index + 1}` : "Sobrantes").join("\t");
  const rows = [];

  for (let row = 0; row < maxRows; row += 1) {
    rows.push(groups.map((team) => {
      const member = team[row];
      return member ? `${member.leader ? "* " : ""}${member.name}` : "";
    }).join("\t"));
  }

  return `${headers}\n${rows.join("\n")}`;
}

async function createResultCanvas() {
  const scale = 2;
  const padding = 36;
  const gap = 18;
  const cardWidth = 280;
  const canvasGroups = leftoverParticipants.length > 0 ? [...currentTeams, leftoverParticipants] : currentTeams;
  const columns = Math.max(1, Math.min(canvasGroups.length, canvasGroups.length <= 4 ? 2 : 3));
  const title = finalTitle.textContent || "Equipos generados";

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  measureContext.font = "16px Arial";

  const teamLayouts = canvasGroups.map((team, index) => {
    const members = team.map((member) => {
      const label = `${member.leader ? "* " : ""}${member.name}`;
      const lines = wrapCanvasText(measureContext, label, cardWidth - 34);
      return { ...member, label, lines };
    });
    const height = 58 + members.reduce((total, member) => total + member.lines.length * 21 + 16, 0);
    return {
      members,
      height: Math.max(150, height),
      title: index < currentTeams.length ? `Equipo ${index + 1}` : "Sobrantes",
      leftover: index >= currentTeams.length
    };
  });

  const rowHeights = [];
  for (let index = 0; index < teamLayouts.length; index += columns) {
    const row = teamLayouts.slice(index, index + columns);
    rowHeights.push(Math.max(...row.map((team) => team.height)));
  }

  const width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
  const height = padding * 2 + 66 + rowHeights.reduce((total, rowHeight) => total + rowHeight, 0) + Math.max(0, rowHeights.length - 1) * gap;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#d81b91";
  context.font = "bold 30px Arial";
  context.textAlign = "center";
  context.fillText(title, width / 2, padding + 30);
  context.textAlign = "left";

  let y = padding + 66;
  teamLayouts.forEach((team, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = padding + column * (cardWidth + gap);
    const cardHeight = rowHeights[row];

    drawRoundRect(context, x, y, cardWidth, cardHeight, 8, team.leftover ? "#fff5f4" : "#fff8fc", team.leftover ? "#d92d20" : "#d81b91");
    context.fillStyle = team.leftover ? "#d92d20" : "#d81b91";
    context.font = "bold 18px Arial";
    context.fillText(team.title, x + 16, y + 30);

    let memberY = y + 54;
    team.members.forEach((member) => {
      const memberHeight = member.lines.length * 21 + 10;
      drawRoundRect(context, x + 16, memberY, cardWidth - 32, memberHeight, 6, member.leader ? "#eefbf6" : "#ffffff", member.leader ? "#69c8a2" : "#dde2ea");
      context.fillStyle = member.leader ? "#0b6f4f" : "#101828";
      context.font = member.leader ? "bold 15px Arial" : "15px Arial";
      member.lines.forEach((line, lineIndex) => {
        context.fillText(line, x + 28, memberY + 21 + lineIndex * 21);
      });
      memberY += memberHeight + 10;
    });

    if (column === columns - 1 || index === teamLayouts.length - 1) {
      y += cardHeight + gap;
    }
  });

  return canvas;
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }

    if (line) {
      lines.push(line);
    }
    line = word;
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : [text];
}

function drawRoundRect(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.stroke();
}

function showMessage(message) {
  actionMessage.textContent = message;
  setTimeout(() => {
    if (actionMessage.textContent === message) {
      actionMessage.textContent = "";
    }
  }, 2800);
}
