// Función principal para renderizar la pantalla de resultados
export default function renderScreen2() {
	const app = document.getElementById('app');
	app.innerHTML = `
    <h1>Winner Declared!</h1>
    <p id="winnerAnnouncement"></p>
    <div id="finalResults">
      <h2>Leaderboard</h2>
      <ul id="playerRankings"></ul>
      <button id="alphabeticalSortBtn">Sort by Name</button>
    </div>
  `;

	// Solicitar los datos del ganador y jugadores al servidor
	socket.emit('fetchWinnerData');

	// Escuchar los datos del ganador y jugadores desde el servidor
	socket.on('declareWinner', handleWinnerInfo);

	// Inicializar el evento para ordenar jugadores alfabéticamente
	initSortByNameButton();

	// Escuchar reinicio del juego
	socket.on('restartGame', handleGameReset);
}

// Función para manejar los datos del ganador y los jugadores
function handleWinnerInfo({ winner, players }) {
	// Mostrar mensaje del ganador
	document.getElementById('winnerAnnouncement').textContent = `Congratulations! The winner is ${winner}.`;

	// Renderizar la lista de jugadores ordenados por puntuación
	renderLeaderboard(players);
}

// Función para renderizar la lista de jugadores
function renderLeaderboard(players) {
	// Ordenar jugadores por puntuación de mayor a menor
	players.sort((a, b) => b.score - a.score);

	//No me funciona funciona

	// Crear elementos de lista con los jugadores y sus puntuaciones
	const leaderboardHTML = players
		.map((player, index) => `<li>${index + 1}. ${player.name} (${player.score} points)</li>`)
		.join('');

	// Insertar la lista en el DOM
	document.getElementById('playerRankings').innerHTML = leaderboardHTML;
}

// Función para inicializar el evento del botón "Ordenar por Nombre"
function initSortByNameButton() {
	const sortButton = document.getElementById('alphabeticalSortBtn');
	sortButton.addEventListener('click', handleAlphabeticalSort);
}

// Función para ordenar la lista de jugadores alfabéticamente
function handleAlphabeticalSort() {
	const rankingsListElement = document.getElementById('playerRankings');
	const rankingItems = Array.from(rankingsListElement.getElementsByTagName('li'));

	// Ordenar los elementos de la lista alfabéticamente por nombre
	rankingItems.sort((a, b) => {
		const namea = a.textContent.split('.')[1].trim();
		const nameb = b.textContent.split('.')[1].trim();
		return namea.localeCompare(nameb);
	});

	// Actualizar la lista en el DOM
	rankingsListElement.innerHTML = '';
	rankingItems.forEach((item) => rankingsListElement.appendChild(item));
}

// Función para manejar el reinicio del juego
function handleGameReset({ message }) {
	console.log(message);
	router.navigateTo('/');
}