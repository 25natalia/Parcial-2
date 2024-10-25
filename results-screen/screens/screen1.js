import { router, socket } from '../routes.js';

// Función para renderizar la pantalla de puntuaciones
export default function renderScreen1() {
	const app = document.getElementById('app');
	app.innerHTML = `
    <h1>Results</h1>
		<p>connected users:</p>
		<div id='users-count'></div>
    <div id="container">
      <ul id="players"></ul>
    </div>

  `;

	const usersCount = document.getElementById('users-count');

	socket.on('userJoined', (data) => {
		usersCount.innerHTML = data?.players.length || 0;
		console.log(data);
	});

	// Inicializar listeners
	initSocketListeners();
}

// Función para actualizar la lista de jugadores en el DOM
function updatePlayerList(players) {
	console.log(players);

	const playersList = players

		.map((player, index) => `<li>${index + 1}. ${player.nickname} (${player.score} pts)</li>`)
		.join('');

	document.getElementById('players').innerHTML = playersList;
}

// Función para inicializar los listeners de socket
function initSocketListeners() {
	// Escuchar actualizaciones de puntuación
	socket.on('newScore', ({ players }) => {
		console.log('Updated scores:', players); // Añade esto para depuración
		updatePlayerList(players);
	});

	// Escuchar cuando un nuevo jugador se une
	socket.on('userJoined', ({ players }) => {
		updatePlayerList(players);
	});

	// Escuchar el anuncio del ganador y redirigir a la pantalla de ganador
	socket.on('announceWinner', ({ winner }) => {
		console.log('Winner announced:', winner);
		router.navigateTo('/screen2');
	});
}
