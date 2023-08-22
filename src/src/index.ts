import { v4 as uuidv4 } from "uuid";

type Game = Record<{
  id: string;
  title: string;
  description: string;
  avatar: string;
  owner: Principal;
  members: Vec<Principal>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type GamePayload = Record<{
  title: string;
  description: string;
  avatar: string;
}>;

const gameStorage: Record<string, Game> = {};

export function addGame(payload: GamePayload): Result<Game, string> {
  if (!ic.isPrincipal(ic.caller())) {
    return Result.Err<Game, string>(`Only principals can add games.`);
  }

  if (!payload.title || !payload.description || !payload.avatar) {
    return Result.Err<Game, string>(
      `Title, description, and avatar are required fields for the game.`
    );
  }

  const existingGame = gameStorage[payload.id];
  if (existingGame !== undefined) {
    return Result.Err<Game, string>(`A game with id=${payload.id} already exists.`);
  }

  const game: Game = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    owner: ic.caller(),
    members: [ic.caller()],
    ...payload,
  };

  try {
    gameStorage[game.id] = game;
    return Result.Ok(game);
  } catch (error) {
    return Result.Err<Game, string>(`Failed to add game: ${error}`);
  }
}

export function updateGame(
  id: string,
  payload: GamePayload
): Result<Game, string> {
  const game = gameStorage[id];
  if (game === undefined) {
    return Result.Err<Game, string>(`Couldn't update a game with id=${id}. Game not found.`);
  }

  if (ic.caller().toString() !== game.owner.toString()) {
    return Result.Err<Game, string>(`You are not authorized to update the game.`);
  }

  if (!payload.title || !payload.description || !payload.avatar) {
    return Result.Err<Game, string>(
      `Title, description, and avatar are required fields for the update.`
    );
  }

  const updatedGame: Game = {
    ...game,
    ...payload,
    updatedAt: Opt.Some(ic.time()),
  };

  try {
    gameStorage[id] = updatedGame;
    return Result.Ok(updatedGame);
  } catch (error) {
    return Result.Err<Game, string>(`Failed to update game: ${error}`);
  }
}

// Implement similar fixes for other functions: addMembersToGame, deleteGame, sendMessage, getMessagesForgame, deleteMessage

// Workaround for uuid package
globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
