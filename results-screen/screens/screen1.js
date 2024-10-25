import { router, socket } from '../routes.js';

// Función para renderizar la pantalla de puntuaciones
export default function renderScreen1() {
	const app = document.getElementById('app');
	app.innerHTML = `

  <div class="container">
    <h1>MARCO-POLO Game</h1>
    <h2>Bienvenido al Juego</h2>
    <p>Ingresa tus datos para unirte al juego.</p>
    <button>Unirse al juego</button>
  </div>


  `;

	// Inicializar listeners
	initSocketListeners();
}

// Función para actualizar la lista de jugadores en el DOM
function updatePlayerList(players) {
	const playersList = players
		.map((player, index) => `<li>${index + 1}. ${player.nickname} (${player.score} pts)</li>`)
		.join('');

	document.getElementById('players').innerHTML = playersList;
}

// Función para inicializar los listeners de socket
function initSocketListeners() {
	// Escuchar actualizaciones de puntuación
	socket.on('updateScore', ({ players }) => {
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