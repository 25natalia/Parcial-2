const { assignRoles } = require('../utils/helpers');

// Maneja la lógica para cuando un nuevo jugador se une al juego.
const joinGameHandler = (socket, db, io) => {
	return (user) => {
		// Se agrega el campo 'score' (puntaje) para cada jugador, inicializándolo en 0.
		db.players.push({ id: socket.id, ...user, score: 0 });
		console.log(db.players);
		// Emitir evento a todos los jugadores conectados informando que un nuevo jugador se ha unido.
		io.emit('userJoined', db); // Se emite la lista de jugadores actualizada.
	};
};

// Maneja el inicio del juego asignando roles a los jugadores.
const startGameHandler = (socket, db, io) => {
	return () => {
		// Asignar roles a los jugadores.
		db.players = assignRoles(db.players);

		// Notificar a cada jugador individualmente el rol que se le ha asignado.
		db.players.forEach((element) => {
			io.to(element.id).emit('startGame', element.role);
		});
	};
};

// Notifica a los jugadores con el rol 'polo' o 'polo-especial' cuando 'marco' grita "Marco!".
const notifyMarcoHandler = (socket, db, io) => {
	return () => {
		// Filtrar los jugadores con los roles 'polo' o 'polo-especial'.
		const rolesToNotify = db.players.filter((user) => user.role === 'polo' || user.role === 'polo-especial');

		// Enviar la notificación "Marco!!!" a los jugadores seleccionados.
		rolesToNotify.forEach((element) => {
			io.to(element.id).emit('notification', {
				message: 'Marco!!!',
				userId: socket.id,
			});
		});
	};
};

// Notifica al jugador con el rol 'marco' cuando 'polo' responde "Polo!".
const notifyPoloHandler = (socket, db, io) => {
	return () => {
		// Filtrar los jugadores con el rol 'marco'.
		const rolesToNotify = db.players.filter((user) => user.role === 'marco');

		// Enviar la notificación "Polo!!" al jugador 'marco'.
		rolesToNotify.forEach((element) => {
			io.to(element.id).emit('notification', {
				message: 'Polo!!',
				userId: socket.id,
			});
		});
	};
};

// Variable global para almacenar al último ganador del juego.
let lastWinner = null;

// Maneja la solicitud del cliente para obtener los datos del último ganador.
const getWinnerDataHandler = (socket, db) => {
	return () => {
		// Si ya hay un ganador anterior, enviarlo al cliente junto con las puntuaciones de todos los jugadores.
		if (lastWinner) {
			socket.emit('announceWinner', {
				winner: lastWinner.nickname,
				// Enviar todos los jugadores y sus puntajes.
				players: db.players.map((player) => ({
					name: player.nickname,
					score: player.score,
				})),
			});
		}
	};
};

// Maneja la selección del jugador 'polo' por parte de 'marco', actualizando las puntuaciones.
const onSelectPoloHandler = (socket, db, io) => {
	return (userID) => {
		// Obtener el jugador con el rol 'marco' (quien selecciona).
		const marcoPlayer = db.players.find((user) => user.id === socket.id);
		// Obtener el jugador seleccionado con el rol 'polo'.
		const poloSelected = db.players.find((user) => user.id === userID);
		// Obtener el jugador con el rol 'polo-especial'.
		const poloEspecial = db.players.find((user) => user.role === 'polo-especial');

		// Si el 'polo-especial' fue atrapado, 'marco' gana puntos y el 'polo-especial' pierde.
		if (poloSelected.role === 'polo-especial') {
			marcoPlayer.score += 50;  // 'Marco' suma puntos.
			poloSelected.score -= 10; // 'Polo-especial' pierde puntos.

			// Notificar a todos los jugadores que el juego ha terminado y actualizar puntuaciones.
			db.players.forEach((element) => {
				io.to(element.id).emit('notifyGameOver', {
					message: `El marco ${marcoPlayer.nickname} ha ganado, ${poloSelected.nickname} ha sido capturado`,
				});
			});
		} else {
			// Si no fue capturado el 'polo-especial', 'marco' pierde puntos.
			marcoPlayer.score -= 10;

			// Si el 'polo-especial' no es atrapado, gana puntos.
			if (poloEspecial) {
				poloEspecial.score += 10;
			}

			// Notificar que 'marco' ha perdido.
			db.players.forEach((element) => {
				io.to(element.id).emit('notifyGameOver', {
					message: `El marco ${marcoPlayer.nickname} ha perdido`,
				});
			});
		}

		// Emitir evento para actualizar las puntuaciones a todos los clientes.
		io.emit('updateScore', {
			players: db.players.map((player) => ({
				name: player.nickname,
				score: player.score,
			})),
		});

		// Si algún jugador alcanza 100 puntos, se anuncia un ganador.
		const winner = db.players.find((player) => player.score >= 100);
		if (winner) {
			lastWinner = winner; // Almacenar al último ganador.
			console.log('Winner:', winner);
			io.emit('announceWinner', {
				winner: winner.nickname,
				// Enviar todos los jugadores y sus puntuaciones.
				players: db.players.map((player) => ({
					name: player.nickname,
					score: player.score,
				})),
			});
		}
	};
};

// Maneja el reinicio del juego, restableciendo puntuaciones y roles.
const restartGameHandler = (socket, db, io) => {
	return () => {
		// Buscar si existe algún jugador con una puntuación mayor o igual a 100, es el ganador.
		const winner = db.players.find((player) => player.score >= 100);

		// Si no hay un ganador, reiniciar el juego asignando roles nuevamente.
		if (!winner) {
			return startGameHandler(socket, db, io)(); // Reiniciar el juego con roles asignados.
		}

		// Si el jugador que ganó tiene el rol 'marco', reiniciar las puntuaciones de todos los jugadores.
		if (winner.role === 'marco') {
			db.players.forEach((player) => {
				player.score = 0; // Reiniciar el puntaje a 0.
			});

			// Notificar a todos los jugadores que el juego ha sido reiniciado.
			io.emit('gameRestarted', {
				message: 'El juego ha sido reiniciado. ¡Buena suerte a todos!',
				players: db.players.map((player) => ({
					name: player.nickname,
					score: player.score,
				})),
			});

			// Asignar roles nuevamente.
			db.players = assignRoles(db.players);

			// Notificar a cada jugador que el juego ha comenzado.
			db.players.forEach((element) => {
				io.to(element.id).emit('startGame', element.role);
			});
		} else {
			// Si el ganador no es 'marco', solo reiniciar el juego asignando roles.
			db.players = assignRoles(db.players);
			db.players.forEach((element) => {
				io.to(element.id).emit('startGame', element.role);
			});
		}
	};
};

// Exportar los manejadores de eventos para su uso en otros archivos.
module.exports = {
	joinGameHandler,
	startGameHandler,
	notifyMarcoHandler,
	notifyPoloHandler,
	onSelectPoloHandler,
	getWinnerDataHandler,
	restartGameHandler,
};
